'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { paymentMethodLabels, saleStatusLabels } from '@/lib/labels';
import {
  emptySaleForm,
  saleFormSchema,
  saleStatusValues,
  toCreateSalePayload,
  type SaleFormValues,
} from '@/lib/sale-form';
import { useAuth } from '@/providers/auth-provider';
import { hasPermission } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FormField, FormSelect, FormTextarea } from '@/components/vehicles/form-field';

const paymentOptions = Object.entries(paymentMethodLabels).map(([value, label]) => ({
  value,
  label,
}));

const statusOptions = saleStatusValues.map((value) => ({
  value,
  label: saleStatusLabels[value] ?? value,
}));

const soldItemKindOptions = [
  { value: 'VEHICLE', label: 'Veículo' },
  { value: 'PRODUCT', label: 'Produto' },
] as const;

export function SaleFormDialog() {
  const queryClient = useQueryClient();
  const { user, isManager } = useAuth();
  const canCreate = hasPermission(user, 'sales:create');
  const [open, setOpen] = useState(false);
  const [soldItemKind, setSoldItemKind] = useState<(typeof soldItemKindOptions)[number]['value']>(
    'VEHICLE',
  );

  const defaultSellerId = user?.id ?? '';

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SaleFormValues>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: emptySaleForm(defaultSellerId),
  });

  useEffect(() => {
    if (open) {
      reset(emptySaleForm(isManager ? '' : defaultSellerId));
      setSoldItemKind('VEHICLE');
    }
  }, [open, reset, isManager, defaultSellerId]);

  const vehiclesQuery = useQuery({
    queryKey: ['vehicles', 'sale-form', soldItemKind],
    queryFn: () =>
      api.getVehicles({
        status: 'IN_STOCK',
        type: soldItemKind === 'PRODUCT' ? 'PRODUCT' : undefined,
        limit: 100,
        page: 1,
      }),
    enabled: open,
  });

  const customersQuery = useQuery({
    queryKey: ['customers', 'sale-form'],
    queryFn: () => api.getCustomers({ limit: 100, page: 1 }),
    enabled: open,
  });

  const usersQuery = useQuery({
    queryKey: ['users', 'sale-sellers'],
    queryFn: () => api.getUsers(),
    enabled: open && isManager,
  });

  const vehicleOptions =
    vehiclesQuery.data?.data
      ?.filter((v) => (soldItemKind === 'PRODUCT' ? v.type === 'PRODUCT' : v.type !== 'PRODUCT'))
      .map((v) => ({
        value: v.id,
        label: `${v.brand} ${v.model}${v.licensePlate ? ` — ${v.licensePlate}` : ''}`,
      })) ?? [];

  const vehicleLabel = soldItemKind === 'PRODUCT' ? 'Produto vendido' : 'Veículo vendido';
  const vehiclePlaceholder =
    soldItemKind === 'PRODUCT' ? 'Selecione o produto…' : 'Selecione o veículo…';

  const customerOptions =
    customersQuery.data?.data.map((c) => ({
      value: c.id,
      label: `${c.name} — ${c.document}`,
    })) ?? [];

  const sellerOptions =
    usersQuery.data?.data
      .filter((u) => ['SELLER', 'MANAGER', 'ADMIN'].includes(u.role))
      .map((u) => ({ value: u.id, label: u.name })) ?? [];

  const saveMutation = useMutation({
    mutationFn: (values: SaleFormValues) =>
      api.createSale(toCreateSalePayload(values, isManager)),
    onSuccess: (sale) => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Venda registrada');
      if (sale.commission) {
        toast.message(`Comissão calculada: ${formatCurrency(sale.commission)}`, {
          duration: 5000,
        });
      }
      setOpen(false);
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao registrar venda');
    },
  });

  if (!canCreate) return null;

  const selectedStatus = watch('status');
  const showsCommissionHint = selectedStatus === 'SOLD' || selectedStatus === 'COMPLETED';

  return (
    <Dialog modal={false} open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Nova venda</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-visible">
        <DialogHeader>
          <DialogTitle>Registrar venda</DialogTitle>
          <DialogDescription>
            Registre a negociação ou venda do veículo. A comissão é calculada ao finalizar.
          </DialogDescription>
        </DialogHeader>

        <form
          noValidate
          onSubmit={handleSubmit((values) => {
            if (isManager && !values.sellerId) {
              setError('sellerId', { message: 'Selecione o vendedor' });
              return;
            }
            return saveMutation.mutateAsync(values);
          })}
          className="max-h-[calc(90vh-8rem)] space-y-4 overflow-y-auto pr-1"
        >
          <FormSelect
            label="Tipo"
            required
            value={soldItemKind}
            onChange={(v) => {
              setSoldItemKind(v as any);
              setValue('vehicleId', '', { shouldValidate: true, shouldDirty: true });
            }}
            options={soldItemKindOptions as unknown as { value: string; label: string }[]}
            error={undefined}
          />

          <FormSelect
            label={vehicleLabel}
            required
            value={watch('vehicleId')}
            onChange={(v) => setValue('vehicleId', v, { shouldValidate: true })}
            options={vehicleOptions}
            placeholder={vehiclePlaceholder}
            error={errors.vehicleId?.message}
          />

          <FormSelect
            label="Cliente comprador"
            required
            value={watch('customerId')}
            onChange={(v) => setValue('customerId', v, { shouldValidate: true })}
            options={customerOptions}
            placeholder="Selecione o cliente…"
            error={errors.customerId?.message}
          />

          {isManager ? (
            <FormSelect
              label="Vendedor responsável"
              required
              value={watch('sellerId') ?? ''}
              onChange={(v) => setValue('sellerId', v, { shouldValidate: true })}
              options={sellerOptions}
              placeholder="Selecione o vendedor…"
              error={errors.sellerId?.message}
            />
          ) : (
            <p className="text-xs text-muted-foreground">
              Vendedor responsável: {user?.name ?? 'você'}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Valor de venda (R$)" required error={errors.amount?.message}>
              <CurrencyInput
                value={watch('amount') || undefined}
                onChange={(v) =>
                  setValue('amount', v ?? 0, { shouldValidate: true, shouldDirty: true })
                }
              />
            </FormField>
            <FormField label="Data da venda" required error={errors.saleDate?.message}>
              <Input type="date" {...register('saleDate')} />
            </FormField>
          </div>

          <FormSelect
            label="Forma de pagamento"
            required
            value={watch('paymentMethod')}
            onChange={(v) => setValue('paymentMethod', v, { shouldValidate: true })}
            options={paymentOptions}
            error={errors.paymentMethod?.message}
          />

          <FormSelect
            label="Status da venda"
            required
            value={watch('status')}
            onChange={(v) =>
              setValue('status', v as SaleFormValues['status'], { shouldValidate: true })
            }
            options={statusOptions}
            error={errors.status?.message}
          />

          {showsCommissionHint ? (
            <p className="rounded-md border border-brand-100 bg-brand-50/60 px-3 py-2 text-xs text-brand-800">
              Ao salvar como <strong>Vendido</strong> ou <strong>Finalizado</strong>, o sistema
              atualiza a ficha financeira do veículo e calcula a comissão automaticamente.
            </p>
          ) : null}

          <FormTextarea
            label="Observações"
            rows={3}
            placeholder="Detalhes da negociação, condições, pendências…"
            error={errors.notes?.message}
            {...register('notes')}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting || saveMutation.isPending}>
            {isSubmitting || saveMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando…
              </>
            ) : (
              'Registrar venda'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
