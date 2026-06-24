'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Calculator, Loader2, RefreshCw } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { hasPermission } from '@/lib/permissions';
import { useAuth } from '@/providers/auth-provider';
import { PricingIntelligencePanel } from '@/components/pricing-intelligence/pricing-intelligence-panel';
import {
  toFinancialFormValues,
  toFinancialUpdatePayload,
  vehicleFinancialFormSchema,
  type VehicleFinancialFormValues,
} from '@/lib/vehicle-financial-form';
import type { VehicleFinancialDetail } from '@/types/api';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, FormSelect } from './form-field';
import { VehicleFinancialResultCard } from './vehicle-financial-result-card';

export function VehicleFinancialForm({
  vehicleId,
  canUpdate,
}: {
  vehicleId: string;
  canUpdate: boolean;
}) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canUsePricing = hasPermission(user, 'pricing-intelligence:read');
  const [marginPercent, setMarginPercent] = useState('12');
  const [estimatedCosts, setEstimatedCosts] = useState<number | undefined>();
  const [estimatedCostsInitialized, setEstimatedCostsInitialized] = useState(false);

  useEffect(() => {
    setEstimatedCostsInitialized(false);
  }, [vehicleId]);

  const financialQuery = useQuery({
    queryKey: ['vehicles', vehicleId, 'financial'],
    queryFn: () => api.getVehicleFinancial(vehicleId),
  });

  const suppliersQuery = useQuery({
    queryKey: ['suppliers', 'options'],
    queryFn: () => api.getSuppliers({ limit: 200, page: 1 }),
  });

  const customersQuery = useQuery({
    queryKey: ['customers', 'options'],
    queryFn: () => api.getCustomers({ limit: 500, page: 1 }),
  });

  const sellersQuery = useQuery({
    queryKey: ['users', 'sellers'],
    queryFn: () => api.getUsers(),
  });

  const supplierOptions =
    suppliersQuery.data?.data.map((s) => ({ value: s.id, label: s.name })) ?? [];

  const customerOptions = useMemo(() => {
    const fromList =
      customersQuery.data?.data.map((c) => ({ value: c.id, label: c.name })) ?? [];
    const fin = financialQuery.data;
    if (fin?.customerId && fin.customer?.name) {
      const exists = fromList.some((o) => o.value === fin.customerId);
      if (!exists) {
        return [{ value: fin.customerId, label: fin.customer.name }, ...fromList];
      }
    }
    return fromList;
  }, [customersQuery.data, financialQuery.data]);

  const sellerOptions = useMemo(() => {
    const fromList =
      sellersQuery.data?.data
        ?.filter((u) => ['SELLER', 'MANAGER', 'ADMIN'].includes(u.role))
        .map((u) => ({ value: u.id, label: u.name })) ?? [];
    const fin = financialQuery.data;
    if (fin?.sellerId && fin.seller?.name) {
      const exists = fromList.some((o) => o.value === fin.sellerId);
      if (!exists) {
        return [{ value: fin.sellerId, label: fin.seller.name }, ...fromList];
      }
    }
    return fromList;
  }, [sellersQuery.data, financialQuery.data]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<VehicleFinancialFormValues>({
    resolver: zodResolver(vehicleFinancialFormSchema),
    defaultValues: {
      purchaseValue: 0,
      purchaseDate: '',
      supplierId: '',
      customerId: '',
      sellerId: '',
    },
  });

  useEffect(() => {
    if (financialQuery.data) {
      reset(toFinancialFormValues(financialQuery.data));
      if (!estimatedCostsInitialized) {
        const total = parseFloat(financialQuery.data.totalCosts);
        setEstimatedCosts(Number.isNaN(total) || total <= 0 ? undefined : total);
        setEstimatedCostsInitialized(true);
      }
    }
  }, [financialQuery.data, reset, estimatedCostsInitialized]);

  const saveMutation = useMutation({
    mutationFn: (values: VehicleFinancialFormValues) =>
      api.updateVehicleFinancial(vehicleId, toFinancialUpdatePayload(values)),
    onSuccess: (data) => {
      queryClient.setQueryData(['vehicles', vehicleId, 'financial'], data);
      queryClient.invalidateQueries({ queryKey: ['vehicles', vehicleId] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Ficha financeira salva');
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao salvar financeiro');
    },
  });

  const recalcMutation = useMutation({
    mutationFn: () => api.recalculateVehicleFinancial(vehicleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles', vehicleId, 'financial'] });
      toast.success('Resultado recalculado');
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao recalcular');
    },
  });

  const suggestMutation = useMutation({
    mutationFn: () => {
      const fipe = watch('fipeValue');
      if (!fipe || fipe <= 0) {
        throw new Error('Informe o valor FIPE');
      }
      const costs = estimatedCosts ?? 0;
      const percent = parseFloat(marginPercent.replace(',', '.'));
      return api.suggestVehiclePurchase(vehicleId, {
        fipeValue: fipe,
        estimatedCosts: costs,
        desiredMarginPercent: Number.isNaN(percent) ? 12 : percent,
      });
    },
    onSuccess: (result) => {
      setValue('fipeValue', parseFloat(result.fipeValue), { shouldDirty: true });
      setValue('suggestedPurchaseValue', parseFloat(result.suggestedPurchaseValue), {
        shouldDirty: true,
      });
      toast.success('Valor sugerido de compra calculado');
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Erro na sugestão de compra');
    },
  });

  if (financialQuery.isLoading) {
    return <p className="text-sm text-brand-600">Carregando ficha financeira…</p>;
  }

  if (financialQuery.isError || !financialQuery.data) {
    return (
      <p className="text-sm text-destructive">
        Não foi possível carregar os dados financeiros deste veículo.
      </p>
    );
  }

  const financial = financialQuery.data;
  const readOnly = !canUpdate;

  async function onSubmit(values: VehicleFinancialFormValues) {
    await saveMutation.mutateAsync(values);
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Compra</CardTitle>
          <CardDescription>Origem e valores na entrada do veículo</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField label="Valor de compra (R$)" required error={errors.purchaseValue?.message}>
            <CurrencyInput
              value={watch('purchaseValue')}
              onChange={(v) =>
                setValue('purchaseValue', v ?? 0, { shouldValidate: true, shouldDirty: true })
              }
              disabled={readOnly}
            />
          </FormField>
          <FormField label="Data da compra" error={errors.purchaseDate?.message}>
            <Input type="date" {...register('purchaseDate')} disabled={readOnly} />
          </FormField>
          <FormSelect
            label="Fornecedor"
            value={watch('supplierId') ?? ''}
            onChange={(v) => setValue('supplierId', v)}
            options={supplierOptions}
            placeholder="Nenhum"
            disabled={readOnly}
          />
          <FormField label="Valor FIPE na compra (R$)" error={errors.fipeValue?.message}>
            <CurrencyInput
              value={watch('fipeValue')}
              onChange={(v) => setValue('fipeValue', v, { shouldDirty: true })}
              disabled={readOnly}
            />
          </FormField>
          <FormField
            label="Valor sugerido de compra (R$)"
            error={errors.suggestedPurchaseValue?.message}
          >
            <CurrencyInput
              value={watch('suggestedPurchaseValue')}
              onChange={(v) => setValue('suggestedPurchaseValue', v, { shouldDirty: true })}
              disabled={readOnly}
            />
          </FormField>
        </CardContent>
      </Card>

      {!readOnly ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calculator className="h-4 w-4" />
              Calcular sugestão de compra
            </CardTitle>
            <CardDescription>Valor FIPE − margem desejada − custos estimados</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end gap-4">
            <FormField label="Margem desejada (%)" className="w-40">
              <Input
                type="number"
                min={0}
                step="0.1"
                value={marginPercent}
                onChange={(e) => setMarginPercent(e.target.value)}
              />
            </FormField>
            <FormField label="Custos estimados (R$)" className="w-48">
              <CurrencyInput value={estimatedCosts} onChange={setEstimatedCosts} />
            </FormField>
            <Button
              type="button"
              variant="outline"
              disabled={suggestMutation.isPending}
              onClick={() => suggestMutation.mutate()}
            >
              {suggestMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Calcular sugestão'
              )}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {canUsePricing ? (
        <PricingIntelligencePanel
          vehicleId={vehicleId}
          canApplyListing={canUpdate}
          onApplyListing={(value) => {
            setValue('listedValue', value, { shouldDirty: true });
            setValue('minimumValue', Math.round(value * 0.95), { shouldDirty: true });
            toast.success('Valores sugeridos aplicados ao anúncio');
          }}
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Anúncio</CardTitle>
          <CardDescription>Valores de exposição no estoque</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField label="Valor anunciado (R$)" error={errors.listedValue?.message}>
            <CurrencyInput
              value={watch('listedValue')}
              onChange={(v) => setValue('listedValue', v, { shouldDirty: true })}
              disabled={readOnly}
            />
          </FormField>
          <FormField label="Valor mínimo de venda (R$)" error={errors.minimumValue?.message}>
            <CurrencyInput
              value={watch('minimumValue')}
              onChange={(v) => setValue('minimumValue', v, { shouldDirty: true })}
              disabled={readOnly}
            />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Venda</CardTitle>
          <CardDescription>
            Pode ser preenchido aqui ou automaticamente ao registrar uma venda
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField label="Valor final de venda (R$)" error={errors.saleValue?.message}>
            <CurrencyInput
              value={watch('saleValue')}
              onChange={(v) => setValue('saleValue', v, { shouldDirty: true })}
              disabled={readOnly}
            />
          </FormField>
          <FormField label="Data da venda" error={errors.saleDate?.message}>
            <Input type="date" {...register('saleDate')} disabled={readOnly} />
          </FormField>
          <FormSelect
            label="Cliente comprador"
            value={watch('customerId') ?? ''}
            onChange={(v) => setValue('customerId', v)}
            options={customerOptions}
            placeholder="Nenhum"
            disabled={readOnly}
          />
          <FormSelect
            label="Vendedor responsável"
            value={watch('sellerId') ?? ''}
            onChange={(v) => setValue('sellerId', v)}
            options={sellerOptions}
            placeholder="Nenhum"
            disabled={readOnly}
          />
        </CardContent>
      </Card>

      <VehicleFinancialResultCard financial={financial} />

      {canUpdate ? (
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={isSubmitting || saveMutation.isPending}>
            {isSubmitting || saveMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando…
              </>
            ) : (
              'Salvar ficha financeira'
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={recalcMutation.isPending}
            onClick={() => recalcMutation.mutate()}
          >
            {recalcMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Recalcular resultado
          </Button>
        </div>
      ) : null}
    </form>
  );
}
