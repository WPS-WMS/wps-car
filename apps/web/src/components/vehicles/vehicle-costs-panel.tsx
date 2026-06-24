'use client';

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { toast } from 'sonner';
import { ExternalLink, FileText, Loader2, Plus, Trash2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { vehicleCostTypeOptions } from '@/lib/financial-labels';
import { formatCurrency, formatDate } from '@/lib/format';
import { useAuthenticatedMediaDownload } from '@/hooks/use-authenticated-media';
import type { VehicleCost } from '@/types/api';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FormField, FormSelect, FormTextarea } from './form-field';

const costFormSchema = z.object({
  type: z.string().min(1, 'Tipo é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória').max(500),
  amount: z.number().min(0.01, 'Valor é obrigatório'),
  costDate: z.string().min(1, 'Data é obrigatória'),
  supplierId: z.string().optional(),
  responsibleId: z.string().min(1, 'Responsável é obrigatório'),
});

type CostFormValues = z.infer<typeof costFormSchema>;

function emptyCostForm(defaultResponsibleId: string): CostFormValues {
  return {
    type: 'OTHER',
    description: '',
    amount: 0.01,
    costDate: new Date().toISOString().slice(0, 10),
    supplierId: '',
    responsibleId: defaultResponsibleId,
  };
}

function costToForm(cost: VehicleCost): CostFormValues {
  return {
    type: cost.type,
    description: cost.description,
    amount: parseFloat(cost.amount),
    costDate: new Date(cost.costDate).toISOString().slice(0, 10),
    supplierId: cost.supplierId ?? '',
    responsibleId: cost.responsibleId ?? cost.createdById ?? '',
  };
}

export function VehicleCostsPanel({
  vehicleId,
  canManage,
}: {
  vehicleId: string;
  canManage: boolean;
}) {
  const { user } = useAuth();
  const downloadMedia = useAuthenticatedMediaDownload();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<VehicleCost | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [removeReceiptOnSave, setRemoveReceiptOnSave] = useState(false);

  const costsQuery = useQuery({
    queryKey: ['vehicles', vehicleId, 'costs'],
    queryFn: () => api.getVehicleCosts(vehicleId),
  });

  const suppliersQuery = useQuery({
    queryKey: ['suppliers', 'options'],
    queryFn: () => api.getSuppliers({ limit: 200, page: 1 }),
  });

  const usersQuery = useQuery({
    queryKey: ['users', 'cost-responsible'],
    queryFn: () => api.getUsers(),
  });

  const supplierOptions =
    suppliersQuery.data?.data.map((s) => ({ value: s.id, label: s.name })) ?? [];

  const userOptions =
    usersQuery.data?.data.map((u) => ({ value: u.id, label: u.name })) ?? [];

  const defaultResponsibleId = user?.id ?? '';

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CostFormValues>({
    resolver: zodResolver(costFormSchema),
    defaultValues: emptyCostForm(defaultResponsibleId),
  });

  const saveMutation = useMutation({
    mutationFn: async (values: CostFormValues) => {
      const payload = {
        type: values.type,
        description: values.description.trim(),
        amount: values.amount,
        costDate: new Date(values.costDate).toISOString(),
        supplierId: values.supplierId || undefined,
        responsibleId: values.responsibleId,
      };

      let costId: string;

      if (editing) {
        const result = await api.updateVehicleCost(vehicleId, editing.id, payload);
        costId = result.cost.id;
      } else {
        const result = await api.createVehicleCost(vehicleId, payload);
        costId = result.cost.id;
      }

      if (removeReceiptOnSave && editing?.receipt) {
        await api.deleteVehicleCostReceipt(vehicleId, costId);
      } else if (receiptFile) {
        await api.uploadVehicleCostReceipt(vehicleId, costId, receiptFile);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles', vehicleId, 'costs'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles', vehicleId, 'financial'] });
      toast.success(editing ? 'Custo atualizado' : 'Custo lançado');
      closeDialog();
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao salvar custo');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (costId: string) => api.deleteVehicleCost(vehicleId, costId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles', vehicleId, 'costs'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles', vehicleId, 'financial'] });
      toast.success('Custo removido');
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao remover custo');
    },
  });

  function openCreate() {
    setEditing(null);
    setReceiptFile(null);
    setRemoveReceiptOnSave(false);
    reset(emptyCostForm(defaultResponsibleId));
    setDialogOpen(true);
  }

  function openEdit(cost: VehicleCost) {
    setEditing(cost);
    setReceiptFile(null);
    setRemoveReceiptOnSave(false);
    reset(costToForm(cost));
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditing(null);
    setReceiptFile(null);
    setRemoveReceiptOnSave(false);
    reset(emptyCostForm(defaultResponsibleId));
  }

  const costs = costsQuery.data?.data ?? [];
  const typeLabel = (type: string) =>
    vehicleCostTypeOptions.find((o) => o.value === type)?.label ?? type;

  const existingReceiptLabel = editing?.receipt?.fileName;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>Custos do veículo</CardTitle>
            <CardDescription>
              Lance despesas específicas (pintura, mecânica, documentação, etc.) com comprovante
              opcional
            </CardDescription>
          </div>
          {canManage ? (
            <Button type="button" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Novo custo
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {costsQuery.isLoading ? (
            <p className="text-sm text-brand-600">Carregando custos…</p>
          ) : costs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum custo lançado para este veículo.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Comprovante</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    {canManage ? <TableHead className="w-28" /> : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costs.map((cost) => {
                    return (
                      <TableRow key={cost.id}>
                        <TableCell>{formatDate(cost.costDate)}</TableCell>
                        <TableCell>{typeLabel(cost.type)}</TableCell>
                        <TableCell className="max-w-[180px] truncate" title={cost.description}>
                          {cost.description}
                        </TableCell>
                        <TableCell>{cost.supplier?.name ?? '—'}</TableCell>
                        <TableCell>{cost.responsible?.name ?? '—'}</TableCell>
                        <TableCell>
                          {cost.receipt?.url ? (
                            <button
                              type="button"
                              onClick={() =>
                                downloadMedia(cost.receipt?.url, cost.receipt?.fileName)
                              }
                              className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              Ver
                              <ExternalLink className="h-3 w-3" />
                            </button>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(cost.amount)}
                        </TableCell>
                        {canManage ? (
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => openEdit(cost)}
                              >
                                Editar
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                                disabled={deleteMutation.isPending}
                                onClick={() => {
                                  if (window.confirm('Remover este custo?')) {
                                    deleteMutation.mutate(cost.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        ) : null}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog modal={false} open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-visible">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar custo' : 'Novo custo'}</DialogTitle>
            <DialogDescription>
              Preencha os dados do lançamento. O total será recalculado na ficha financeira.
            </DialogDescription>
          </DialogHeader>
          <form
            noValidate
            onSubmit={handleSubmit((values) => saveMutation.mutateAsync(values))}
            className="max-h-[calc(90vh-8rem)] space-y-4 overflow-y-auto pr-1"
          >
            <FormSelect
              label="Tipo de custo"
              required
              value={watch('type')}
              onChange={(v) => setValue('type', v)}
              options={vehicleCostTypeOptions}
            />
            <FormTextarea
              label="Descrição"
              required
              rows={2}
              error={errors.description?.message}
              {...register('description')}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Valor (R$)" required error={errors.amount?.message}>
                <CurrencyInput
                  value={watch('amount')}
                  onChange={(v) =>
                    setValue('amount', v ?? 0, { shouldValidate: true, shouldDirty: true })
                  }
                />
              </FormField>
              <FormField label="Data" required error={errors.costDate?.message}>
                <Input type="date" {...register('costDate')} />
              </FormField>
            </div>
            <FormSelect
              label="Fornecedor"
              value={watch('supplierId') ?? ''}
              onChange={(v) => setValue('supplierId', v)}
              options={supplierOptions}
              placeholder="Nenhum"
            />
            <FormSelect
              label="Usuário responsável pelo lançamento"
              required
              value={watch('responsibleId')}
              onChange={(v) => setValue('responsibleId', v, { shouldValidate: true })}
              options={userOptions}
              error={errors.responsibleId?.message}
            />
            {editing?.createdBy ? (
              <p className="text-xs text-muted-foreground">
                Lançado por: {editing.createdBy.name}
              </p>
            ) : null}

            <FormField label="Anexo da nota / comprovante">
              <div className="space-y-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/jpeg,image/png,image/webp"
                  className="cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    setReceiptFile(file ?? null);
                    if (file) setRemoveReceiptOnSave(false);
                  }}
                />
                <p className="text-xs text-muted-foreground">PDF, JPEG, PNG ou WebP (máx. 10 MB)</p>
                {existingReceiptLabel && !receiptFile && !removeReceiptOnSave ? (
                  <div className="flex flex-wrap items-center gap-2 rounded-md border border-brand-100 bg-brand-50/50 px-3 py-2 text-sm">
                    <FileText className="h-4 w-4 shrink-0 text-brand-600" />
                    <span className="truncate">{existingReceiptLabel}</span>
                    {editing?.receipt ? (
                      <button
                        type="button"
                        onClick={() =>
                          downloadMedia(editing.receipt?.url, editing.receipt?.fileName)
                        }
                        className="text-brand-600 hover:underline"
                      >
                        Abrir
                      </button>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => {
                        setRemoveReceiptOnSave(true);
                        setReceiptFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    >
                      Remover
                    </Button>
                  </div>
                ) : null}
                {receiptFile ? (
                  <p className="text-xs text-brand-700">Novo arquivo: {receiptFile.name}</p>
                ) : null}
              </div>
            </FormField>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || saveMutation.isPending}>
                {isSubmitting || saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editing ? (
                  'Salvar'
                ) : (
                  'Lançar custo'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
