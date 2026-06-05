'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import { paymentMethodLabels, saleStatusLabels, saleStatusVariant } from '@/lib/labels';
import {
  saleFormSchema,
  saleStatusValues,
  toUpdateSalePayload,
  type SaleFormValues,
} from '@/lib/sale-form';
import type { Sale } from '@/types/api';
import { useAuth } from '@/providers/auth-provider';
import { hasPermission } from '@/lib/permissions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormField, FormNativeSelect, FormTextarea } from '@/components/vehicles/form-field';

const paymentOptions = Object.entries(paymentMethodLabels).map(([value, label]) => ({
  value,
  label,
}));

const statusOptions = saleStatusValues.map((value) => ({
  value,
  label: saleStatusLabels[value] ?? value,
}));

function saleToForm(sale: Sale, isManager: boolean): SaleFormValues {
  return {
    vehicleId: sale.vehicleId,
    customerId: sale.customerId,
    sellerId: isManager ? sale.sellerId : '',
    amount: parseFloat(sale.amount),
    paymentMethod: sale.paymentMethod,
    saleDate: new Date(sale.saleDate).toISOString().slice(0, 10),
    status: sale.status as SaleFormValues['status'],
    notes: sale.notes ?? '',
  };
}

function isFinalized(status: string) {
  return status === 'SOLD' || status === 'COMPLETED';
}

export function SaleEditDialog({
  saleId,
  open,
  onOpenChange,
}: {
  saleId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { user, isManager } = useAuth();
  const canUpdate = hasPermission(user, 'sales:update');

  const saleQuery = useQuery({
    queryKey: ['sales', saleId],
    queryFn: () => api.getSale(saleId!),
    enabled: open && !!saleId,
  });

  const customersQuery = useQuery({
    queryKey: ['customers', 'sale-form'],
    queryFn: () => api.getCustomers({ limit: 200, page: 1 }),
    enabled: open,
  });

  const usersQuery = useQuery({
    queryKey: ['users', 'sale-sellers'],
    queryFn: () => api.getUsers(),
    enabled: open && isManager,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SaleFormValues>({
    resolver: zodResolver(saleFormSchema),
  });

  useEffect(() => {
    if (saleQuery.data) {
      reset(saleToForm(saleQuery.data, isManager));
    }
  }, [saleQuery.data, reset, isManager]);

  const saveMutation = useMutation({
    mutationFn: (values: SaleFormValues) => {
      if (sale && isFinalized(sale.status) && values.status === 'CANCELLED') {
        return api.updateSale(saleId!, { status: 'CANCELLED' });
      }
      return api.updateSale(saleId!, toUpdateSalePayload(values, isManager));
    },
    onSuccess: (sale) => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Venda atualizada');
      if (sale.commission) {
        toast.message(`Comissão: ${formatCurrency(sale.commission)}`, { duration: 4000 });
      }
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao atualizar venda');
    },
  });

  const sale = saleQuery.data;
  const readOnly = !canUpdate || (sale ? isFinalized(sale.status) : false);
  const onlyCancelAllowed = sale && isFinalized(sale.status) && canUpdate;

  const customerOptions =
    customersQuery.data?.data.map((c) => ({
      value: c.id,
      label: `${c.name} — ${c.document}`,
    })) ?? [];

  const sellerOptions =
    usersQuery.data?.data
      .filter((u) => ['SELLER', 'MANAGER', 'ADMIN'].includes(u.role))
      .map((u) => ({ value: u.id, label: u.name })) ?? [];

  const vehicleLabel = sale?.vehicle
    ? `${sale.vehicle.brand} ${sale.vehicle.model}${sale.vehicle.licensePlate ? ` — ${sale.vehicle.licensePlate}` : ''}`
    : '—';

  return (
    <Dialog modal={false} open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-visible">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            Detalhes da venda
            {sale ? (
              <Badge variant={saleStatusVariant(sale.status)}>
                {saleStatusLabels[sale.status] ?? sale.status}
              </Badge>
            ) : null}
          </DialogTitle>
          <DialogDescription>
            {sale ? `Registrada em ${formatDate(sale.createdAt)}` : 'Carregando…'}
          </DialogDescription>
        </DialogHeader>

        {saleQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando venda…</p>
        ) : saleQuery.isError || !sale ? (
          <p className="text-sm text-destructive">Não foi possível carregar a venda.</p>
        ) : (
          <form
            noValidate
            onSubmit={handleSubmit((values) => saveMutation.mutateAsync(values))}
            className="max-h-[calc(90vh-8rem)] space-y-4 overflow-y-auto pr-1"
          >
            <FormField label="Veículo vendido">
              <Input value={vehicleLabel} disabled readOnly />
            </FormField>

            <FormNativeSelect
              label="Cliente comprador"
              required
              value={watch('customerId')}
              onChange={(v) => setValue('customerId', v, { shouldValidate: true })}
              options={customerOptions}
              disabled={readOnly && !onlyCancelAllowed}
              error={errors.customerId?.message}
            />

            {isManager ? (
              <FormNativeSelect
                label="Vendedor responsável"
                required
                value={watch('sellerId') ?? ''}
                onChange={(v) => setValue('sellerId', v, { shouldValidate: true })}
                options={sellerOptions}
                disabled={readOnly && !onlyCancelAllowed}
                error={errors.sellerId?.message}
              />
            ) : (
              <FormField label="Vendedor responsável">
                <Input value={sale.seller?.name ?? '—'} disabled readOnly />
              </FormField>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Valor de venda (R$)" required error={errors.amount?.message}>
                <CurrencyInput
                  value={watch('amount') || undefined}
                  onChange={(v) =>
                    setValue('amount', v ?? 0, { shouldValidate: true, shouldDirty: true })
                  }
                  disabled={readOnly && !onlyCancelAllowed}
                />
              </FormField>
              <FormField label="Data da venda" required error={errors.saleDate?.message}>
                <Input
                  type="date"
                  {...register('saleDate')}
                  disabled={readOnly && !onlyCancelAllowed}
                />
              </FormField>
            </div>

            <FormNativeSelect
              label="Forma de pagamento"
              required
              value={watch('paymentMethod')}
              onChange={(v) => setValue('paymentMethod', v, { shouldValidate: true })}
              options={paymentOptions}
              disabled={readOnly && !onlyCancelAllowed}
              error={errors.paymentMethod?.message}
            />

            <FormNativeSelect
              label="Status financeiro da venda"
              required
              value={watch('status')}
              onChange={(v) =>
                setValue('status', v as SaleFormValues['status'], { shouldValidate: true })
              }
              options={
                onlyCancelAllowed
                  ? [
                      { value: sale.status, label: saleStatusLabels[sale.status] ?? sale.status },
                      { value: 'CANCELLED', label: saleStatusLabels.CANCELLED },
                    ]
                  : statusOptions
              }
              disabled={readOnly && !onlyCancelAllowed}
              error={errors.status?.message}
            />

            {sale.commission ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50/80 px-3 py-2">
                <p className="text-xs font-medium text-emerald-900">Comissão calculada</p>
                <p className="text-lg font-semibold text-emerald-950">
                  {formatCurrency(sale.commission)}
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                A comissão será calculada quando o status for Vendido ou Finalizado.
              </p>
            )}

            <FormTextarea
              label="Observações"
              rows={3}
              disabled={readOnly && !onlyCancelAllowed}
              error={errors.notes?.message}
              {...register('notes')}
            />

            {onlyCancelAllowed ? (
              <p className="text-xs text-amber-800">
                Venda finalizada: só é possível alterar o status para Cancelado.
              </p>
            ) : null}

            {canUpdate && (!readOnly || onlyCancelAllowed) ? (
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || saveMutation.isPending}
              >
                {isSubmitting || saveMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando…
                  </>
                ) : (
                  'Salvar alterações'
                )}
              </Button>
            ) : null}
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
