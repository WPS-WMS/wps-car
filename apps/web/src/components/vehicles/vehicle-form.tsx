'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type UseFormSetValue } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { assetTypeLabelCapitalized, isProductType } from '@/lib/asset-type';
import {
  fuelTypeLabels,
  transmissionLabels,
  vehicleCategoryLabels,
  vehicleStatusLabels,
  vehicleTypeLabels,
} from '@/lib/labels';
import {
  emptyVehicleForm,
  toApiPayload,
  vehicleFormSchema,
  type VehicleFormValues,
} from '@/lib/vehicle-form';
import type { Vehicle } from '@/types/api';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, FormSelect, FormTextarea } from './form-field';
import { VehiclePhotosSection } from './vehicle-photos-section';
import { VehiclePendingPhotos } from './vehicle-pending-photos';
import { MAX_VEHICLE_PHOTOS } from '@/lib/vehicle-photos';
import { useAuth } from '@/providers/auth-provider';
import { hasPermission } from '@/lib/permissions';

const typeOptions = Object.entries(vehicleTypeLabels).map(([value, label]) => ({
  value,
  label,
}));
const statusOptions = Object.entries(vehicleStatusLabels).map(([value, label]) => ({
  value,
  label,
}));
const fuelOptions = Object.entries(fuelTypeLabels).map(([value, label]) => ({
  value,
  label,
}));
const transmissionOptions = Object.entries(transmissionLabels).map(([value, label]) => ({
  value,
  label,
}));
const categoryOptions = Object.entries(vehicleCategoryLabels).map(([value, label]) => ({
  value,
  label,
}));

function asOptionalNumber(value: unknown): number | undefined {
  if (value === '' || value === null || value === undefined) return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

function vehicleToForm(v: Vehicle): VehicleFormValues {
  return {
    type: v.type as VehicleFormValues['type'],
    brand: v.brand,
    model: v.model,
    version: v.version ?? '',
    manufactureYear: v.manufactureYear,
    modelYear: v.modelYear,
    licensePlate: v.licensePlate ?? '',
    renavam: v.renavam ?? '',
    chassis: v.chassis ?? '',
    color: v.color ?? '',
    mileage: v.mileage ?? undefined,
    fuel: (v.fuel as VehicleFormValues['fuel']) ?? undefined,
    transmission: (v.transmission as VehicleFormValues['transmission']) ?? undefined,
    doors: v.doors ?? undefined,
    category: (v.category as VehicleFormValues['category']) ?? undefined,
    status: v.status as VehicleFormValues['status'],
    notes: v.notes ?? '',
    purchaseValue: v.financial ? parseFloat(v.financial.purchaseValue) : 0,
    purchaseDate: v.financial?.purchaseDate
      ? new Date(v.financial.purchaseDate).toISOString().slice(0, 10)
      : '',
    listedValue: v.financial?.listedValue
      ? parseFloat(v.financial.listedValue)
      : undefined,
  };
}

function clearVehicleOnlyFields(setValue: UseFormSetValue<VehicleFormValues>) {
  setValue('licensePlate', '');
  setValue('renavam', '');
  setValue('chassis', '');
  setValue('mileage', undefined);
  setValue('fuel', undefined);
  setValue('transmission', undefined);
  setValue('doors', undefined);
  setValue('category', undefined);
}

export function VehicleForm({
  mode,
  vehicleId,
  initialData,
  sections = 'all',
}: {
  mode: 'create' | 'edit';
  vehicleId?: string;
  initialData?: Vehicle;
  /** `data-only` oculta valores financeiros (usado na aba Dados da edição) */
  sections?: 'all' | 'data-only';
}) {
  const router = useRouter();
  const { user } = useAuth();
  const canManagePhotos =
    hasPermission(user, 'vehicles:update') ||
    (mode === 'create' && hasPermission(user, 'vehicles:create'));
  const [pendingPhotos, setPendingPhotos] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: initialData ? vehicleToForm(initialData) : emptyVehicleForm(),
  });

  const assetType = watch('type');
  const manufactureYear = watch('manufactureYear');
  const isProduct = isProductType(assetType);
  const assetLabel = assetTypeLabelCapitalized(assetType);

  useEffect(() => {
    if (initialData) reset(vehicleToForm(initialData));
  }, [initialData, reset]);

  useEffect(() => {
    if (isProduct && manufactureYear) {
      setValue('modelYear', manufactureYear);
    }
  }, [isProduct, manufactureYear, setValue]);

  async function onSubmit(values: VehicleFormValues) {
    try {
      const payload = toApiPayload(values, {
        omitFinancial: sections === 'data-only',
      });
      if (mode === 'create') {
        const created = await api.createVehicle(payload);
        let uploaded = 0;
        if (pendingPhotos.length > 0 && hasPermission(user, 'vehicles:update')) {
          const batch = pendingPhotos.slice(0, MAX_VEHICLE_PHOTOS);
          for (const file of batch) {
            try {
              await api.uploadVehiclePhoto(created.id, file);
              uploaded += 1;
            } catch (uploadErr) {
              toast.error(
                uploadErr instanceof ApiError
                  ? uploadErr.message
                  : 'Erro ao enviar imagem',
              );
              break;
            }
          }
        }
        const photoMsg =
          uploaded > 0
            ? ` com ${uploaded} imagem${uploaded > 1 ? 'ns' : ''}`
            : '';
        toast.success(
          `${assetTypeLabelCapitalized(values.type)} cadastrado${photoMsg} com sucesso`,
        );
        router.push(`/veiculos/${created.id}/editar`);
      } else if (vehicleId) {
        await api.updateVehicle(vehicleId, payload);
        toast.success(`${assetTypeLabelCapitalized(values.type)} atualizado`);
        if (sections === 'all') {
          router.push('/veiculos');
        }
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : `Não foi possível salvar o ${assetTypeLabelCapitalized(values.type).toLowerCase()}`;
      toast.error(message);
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Identificação</CardTitle>
          <CardDescription>
            {isProduct
              ? 'Tipo, fabricante e dados do produto para o estoque'
              : 'Tipo, marca e situação do veículo'}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormSelect
            label="Tipo do bem"
            required
            value={assetType}
            onChange={(v) => {
              const next = v as VehicleFormValues['type'];
              setValue('type', next);
              if (isProductType(next)) clearVehicleOnlyFields(setValue);
            }}
            options={typeOptions}
            error={errors.type?.message}
          />
          <FormField
            label={isProduct ? 'Marca / fabricante' : 'Marca'}
            required
            error={errors.brand?.message}
          >
            <Input
              {...register('brand')}
              placeholder={isProduct ? 'Ex.: Bosch' : 'Ex.: Volkswagen'}
            />
          </FormField>
          <FormField
            label={isProduct ? 'Nome do produto' : 'Modelo'}
            required
            error={errors.model?.message}
          >
            <Input
              {...register('model')}
              placeholder={isProduct ? 'Ex.: Kit revisão completo' : 'Ex.: Gol'}
            />
          </FormField>
          <FormField
            label={isProduct ? 'Referência / SKU' : 'Versão'}
            error={errors.version?.message}
          >
            <Input
              {...register('version')}
              placeholder={isProduct ? 'Ex.: KIT-2024-A' : 'Ex.: 1.0 MPI'}
            />
          </FormField>
          <FormSelect
            label="Status"
            required
            value={watch('status')}
            onChange={(v) => setValue('status', v as VehicleFormValues['status'])}
            options={statusOptions}
            error={errors.status?.message}
          />
        </CardContent>
      </Card>

      {!isProduct ? (
        <Card>
          <CardHeader>
            <CardTitle>Documentação</CardTitle>
            <CardDescription>Placa, Renavam e chassi</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="Placa" error={errors.licensePlate?.message}>
              <Input
                {...register('licensePlate')}
                placeholder="ABC1D23"
                className="uppercase"
              />
            </FormField>
            <FormField label="Renavam" error={errors.renavam?.message}>
              <Input {...register('renavam')} placeholder="Somente números" />
            </FormField>
            <FormField label="Chassi" error={errors.chassis?.message}>
              <Input
                {...register('chassis')}
                placeholder="17 caracteres"
                className="uppercase"
              />
            </FormField>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{isProduct ? 'Detalhes do produto' : 'Características'}</CardTitle>
          <CardDescription>
            {isProduct
              ? 'Ano de referência e cor (opcional)'
              : 'Ano, cor, motor e categoria'}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField
            label={isProduct ? 'Ano de referência' : 'Ano fabricação'}
            required
            error={errors.manufactureYear?.message}
          >
            <Input
              type="number"
              {...register('manufactureYear', {
                valueAsNumber: true,
                onChange: (e) => {
                  if (isProduct) {
                    const y = Number(e.target.value);
                    if (!Number.isNaN(y)) setValue('modelYear', y);
                  }
                },
              })}
            />
          </FormField>
          {!isProduct ? (
            <FormField label="Ano modelo" required error={errors.modelYear?.message}>
              <Input type="number" {...register('modelYear', { valueAsNumber: true })} />
            </FormField>
          ) : null}
          <FormField label="Cor" error={errors.color?.message}>
            <Input {...register('color')} placeholder="Ex.: Prata" />
          </FormField>
          {!isProduct ? (
            <>
              <FormField label="Quilometragem (km)" error={errors.mileage?.message}>
                <Input
                  type="number"
                  min={0}
                  {...register('mileage', { setValueAs: asOptionalNumber })}
                />
              </FormField>
              <FormSelect
                label="Combustível"
                value={watch('fuel') ?? ''}
                onChange={(v) =>
                  setValue('fuel', (v || undefined) as VehicleFormValues['fuel'])
                }
                options={fuelOptions}
              />
              <FormSelect
                label="Câmbio"
                value={watch('transmission') ?? ''}
                onChange={(v) =>
                  setValue('transmission', (v || undefined) as VehicleFormValues['transmission'])
                }
                options={transmissionOptions}
              />
              <FormField label="Número de portas" error={errors.doors?.message}>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  {...register('doors', { setValueAs: asOptionalNumber })}
                />
              </FormField>
              <FormSelect
                label="Categoria"
                value={watch('category') ?? ''}
                onChange={(v) =>
                  setValue('category', (v || undefined) as VehicleFormValues['category'])
                }
                options={categoryOptions}
              />
            </>
          ) : null}
        </CardContent>
      </Card>

      {sections === 'all' ? (
        <Card>
          <CardHeader>
            <CardTitle>Valores</CardTitle>
            <CardDescription>Compra e valor anunciado — detalhes na aba Financeiro após salvar</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="Valor de compra (R$)" required error={errors.purchaseValue?.message}>
              <CurrencyInput
                value={watch('purchaseValue')}
                onChange={(v) =>
                  setValue('purchaseValue', v ?? 0, { shouldValidate: true, shouldDirty: true })
                }
                aria-invalid={errors.purchaseValue ? true : undefined}
              />
            </FormField>
            <FormField label="Data da compra" error={errors.purchaseDate?.message}>
              <Input type="date" {...register('purchaseDate')} />
            </FormField>
            <FormField label="Valor anunciado (R$)" error={errors.listedValue?.message}>
              <CurrencyInput
                value={watch('listedValue')}
                onChange={(v) =>
                  setValue('listedValue', v, { shouldValidate: true, shouldDirty: true })
                }
                aria-invalid={errors.listedValue ? true : undefined}
              />
            </FormField>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <FormTextarea
            label="Notas internas"
            rows={4}
            placeholder={
              isProduct
                ? 'Especificações, compatibilidade, garantia…'
                : 'Detalhes, pendências, histórico…'
            }
            {...register('notes')}
          />
        </CardContent>
      </Card>

      {vehicleId ? (
        <VehiclePhotosSection vehicleId={vehicleId} canManage={canManagePhotos} />
      ) : canManagePhotos ? (
        <VehiclePendingPhotos
          files={pendingPhotos}
          onChange={setPendingPhotos}
          disabled={isSubmitting}
        />
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando…
            </>
          ) : mode === 'create' ? (
            `Cadastrar ${assetLabel.toLowerCase()}`
          ) : (
            'Salvar alterações'
          )}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
