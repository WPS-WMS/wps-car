'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { supplierEditHref } from '@/lib/edit-routes';
import { personTypeLabels, supplierCategoryLabels } from '@/lib/person-labels';
import {
  emptySupplierForm,
  supplierFormSchema,
  toSupplierPayload,
  type SupplierFormValues,
} from '@/lib/supplier-form';
import {
  formatCep,
  formatCpfCnpj,
  formatPhone,
} from '@/lib/br-input-masks';
import type { Supplier } from '@/types/api';
import { DocumentInput } from '@/components/ui/document-input';
import { PhoneInput } from '@/components/ui/phone-input';
import { PersonAddressSection } from './person-address-section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, FormSelect, FormTextarea } from '@/components/vehicles/form-field';
import { EntityHistoryPanel } from './entity-history-panel';
import { SupplierPurchasesPanel } from './supplier-purchases-panel';

const personOptions = Object.entries(personTypeLabels).map(([value, label]) => ({
  value,
  label,
}));
const categoryOptions = Object.entries(supplierCategoryLabels).map(([value, label]) => ({
  value,
  label,
}));

function supplierToForm(s: Supplier): SupplierFormValues {
  const personType = s.personType as SupplierFormValues['personType'];
  return {
    name: s.name,
    document: formatCpfCnpj(s.document, personType),
    phone: formatPhone(s.phone ?? ''),
    email: s.email ?? '',
    personType,
    category: s.category as SupplierFormValues['category'],
    street: s.street ?? '',
    number: s.number ?? '',
    complement: s.complement ?? '',
    neighborhood: s.neighborhood ?? '',
    city: s.city ?? '',
    state: s.state ?? '',
    zipCode: formatCep(s.zipCode ?? ''),
    notes: s.notes ?? '',
  };
}

export function SupplierForm({
  mode,
  supplierId,
  initialData,
  canUpdate,
}: {
  mode: 'create' | 'edit';
  supplierId?: string;
  initialData?: Supplier;
  canUpdate: boolean;
}) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: initialData ? supplierToForm(initialData) : emptySupplierForm(),
  });

  useEffect(() => {
    if (initialData) reset(supplierToForm(initialData));
  }, [initialData, reset]);

  const personType = watch('personType');

  useEffect(() => {
    const document = getValues('document');
    if (!document) return;
    setValue('document', formatCpfCnpj(document, personType), { shouldValidate: true });
  }, [personType, getValues, setValue]);

  async function onSubmit(values: SupplierFormValues) {
    try {
      const payload = toSupplierPayload(values);
      if (mode === 'create') {
        const created = await api.createSupplier(payload);
        toast.success('Fornecedor cadastrado');
        router.push(supplierEditHref(created.id));
      } else if (supplierId) {
        await api.updateSupplier(supplierId, payload);
        toast.success('Fornecedor atualizado');
        router.push('/fornecedores');
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao salvar fornecedor');
    }
  }

  const readOnly = mode === 'edit' && !canUpdate;

  return (
    <div className="space-y-6">
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados do fornecedor</CardTitle>
            <CardDescription>Identificação e contato</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="Nome / Razão social" required error={errors.name?.message}>
              <Input {...register('name')} disabled={readOnly} />
            </FormField>
            <FormField label="CPF / CNPJ" required error={errors.document?.message}>
              <DocumentInput
                value={watch('document')}
                onChange={(v) => setValue('document', v, { shouldValidate: true })}
                personType={personType}
                disabled={readOnly}
              />
            </FormField>
            <FormSelect
              label="Tipo de pessoa"
              required
              value={personType}
              onChange={(v) => setValue('personType', v as SupplierFormValues['personType'])}
              options={personOptions}
            />
            <FormSelect
              label="Tipo de fornecedor"
              required
              value={watch('category')}
              onChange={(v) => setValue('category', v as SupplierFormValues['category'])}
              options={categoryOptions}
              error={errors.category?.message}
            />
            <FormField label="Telefone" error={errors.phone?.message}>
              <PhoneInput
                value={watch('phone') ?? ''}
                onChange={(v) => setValue('phone', v)}
                disabled={readOnly}
              />
            </FormField>
            <FormField label="E-mail" error={errors.email?.message}>
              <Input type="email" {...register('email')} disabled={readOnly} />
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Endereço</CardTitle>
          </CardHeader>
          <CardContent>
            <PersonAddressSection
              register={register}
              errors={errors}
              setValue={setValue}
              getValues={getValues}
              zipCode={watch('zipCode') ?? ''}
              readOnly={readOnly}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <FormTextarea label="Notas internas" rows={4} disabled={readOnly} {...register('notes')} />
          </CardContent>
        </Card>

        {!readOnly ? (
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando…
                </>
              ) : mode === 'create' ? (
                'Cadastrar fornecedor'
              ) : (
                'Salvar alterações'
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
          </div>
        ) : null}
      </form>

      {supplierId ? (
        <>
          <SupplierPurchasesPanel supplierId={supplierId} />
          <EntityHistoryPanel
            entityId={supplierId}
            queryKeyPrefix="suppliers"
            api={{
              getHistory: api.getSupplierHistory,
              addNote: api.addSupplierHistoryNote,
            }}
            canAddNote={canUpdate}
            title="Histórico do fornecedor"
          />
        </>
      ) : null}
    </div>
  );
}
