'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type {
  FieldErrors,
  FieldValues,
  Path,
  UseFormGetValues,
  UseFormRegister,
  UseFormSetValue,
} from 'react-hook-form';
import { formatCep } from '@/lib/br-input-masks';
import { fetchAddressByCep } from '@/lib/viacep';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/vehicles/form-field';

export type PersonAddressFields = {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
};

export function PersonAddressSection<T extends FieldValues & PersonAddressFields>({
  register,
  errors,
  setValue,
  getValues,
  zipCode,
  readOnly,
}: {
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
  setValue: UseFormSetValue<T>;
  getValues: UseFormGetValues<T>;
  zipCode: string;
  readOnly?: boolean;
}) {
  const [cepLoading, setCepLoading] = useState(false);

  async function lookupCep(raw: string) {
    const formatted = formatCep(raw);
    setValue('zipCode' as Path<T>, formatted as Parameters<UseFormSetValue<T>>[1], {
      shouldDirty: true,
    });

    const digits = formatted.replace(/\D/g, '');
    if (digits.length !== 8) return;

    setCepLoading(true);
    try {
      const address = await fetchAddressByCep(digits);
      if (!address) {
        toast.error('CEP não encontrado');
        return;
      }

      setValue('street' as Path<T>, address.street as Parameters<UseFormSetValue<T>>[1], {
        shouldDirty: true,
      });
      setValue('neighborhood' as Path<T>, address.neighborhood as Parameters<UseFormSetValue<T>>[1], {
        shouldDirty: true,
      });
      setValue('city' as Path<T>, address.city as Parameters<UseFormSetValue<T>>[1], {
        shouldDirty: true,
      });
      setValue('state' as Path<T>, address.state as Parameters<UseFormSetValue<T>>[1], {
        shouldDirty: true,
      });

      const current = getValues();
      if (address.complement && !current.complement?.trim()) {
        setValue('complement' as Path<T>, address.complement as Parameters<UseFormSetValue<T>>[1], {
          shouldDirty: true,
        });
      }
    } catch {
      toast.error('Não foi possível consultar o CEP');
    } finally {
      setCepLoading(false);
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <FormField label="CEP" error={errors.zipCode?.message as string | undefined}>
        <div className="relative">
          <Input
            value={zipCode}
            disabled={readOnly || cepLoading}
            placeholder="00000-000"
            inputMode="numeric"
            autoComplete="postal-code"
            onChange={(e) => {
              const formatted = formatCep(e.target.value);
              setValue('zipCode' as Path<T>, formatted as Parameters<UseFormSetValue<T>>[1], {
                shouldDirty: true,
              });
              if (formatted.replace(/\D/g, '').length === 8) {
                void lookupCep(formatted);
              }
            }}
            onBlur={(e) => void lookupCep(e.target.value)}
          />
          {cepLoading ? (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          ) : null}
        </div>
      </FormField>
      <FormField
        label="Logradouro"
        className="sm:col-span-2"
        error={errors.street?.message as string | undefined}
      >
        <Input {...register('street' as Path<T>)} disabled={readOnly} />
      </FormField>
      <FormField label="Número" error={errors.number?.message as string | undefined}>
        <Input {...register('number' as Path<T>)} disabled={readOnly} />
      </FormField>
      <FormField label="Complemento" error={errors.complement?.message as string | undefined}>
        <Input {...register('complement' as Path<T>)} disabled={readOnly} />
      </FormField>
      <FormField label="Bairro" error={errors.neighborhood?.message as string | undefined}>
        <Input {...register('neighborhood' as Path<T>)} disabled={readOnly} />
      </FormField>
      <FormField label="Cidade" error={errors.city?.message as string | undefined}>
        <Input {...register('city' as Path<T>)} disabled={readOnly} />
      </FormField>
      <FormField label="UF" error={errors.state?.message as string | undefined}>
        <Input
          {...register('state' as Path<T>)}
          maxLength={2}
          disabled={readOnly}
          className="uppercase"
        />
      </FormField>
    </div>
  );
}