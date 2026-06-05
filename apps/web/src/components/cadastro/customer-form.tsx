'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { customerEditHref } from '@/lib/edit-routes';
import {
  customerTypeLabels,
  personTypeLabels,
} from '@/lib/person-labels';
import {
  customerFormSchema,
  emptyCustomerForm,
  toCustomerPayload,
  type CustomerFormValues,
} from '@/lib/customer-form';
import {
  formatCep,
  formatCpfCnpj,
  formatPhone,
} from '@/lib/br-input-masks';
import type { Customer } from '@/types/api';
import { DocumentInput } from '@/components/ui/document-input';
import { PhoneInput } from '@/components/ui/phone-input';
import { PersonAddressSection } from './person-address-section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, FormSelect, FormTextarea } from '@/components/vehicles/form-field';
import { EntityHistoryPanel } from './entity-history-panel';
import { CustomerSalesPanel } from './customer-sales-panel';

const personOptions = Object.entries(personTypeLabels).map(([value, label]) => ({
  value,
  label,
}));
const customerTypeOptions = Object.entries(customerTypeLabels).map(([value, label]) => ({
  value,
  label,
}));

function customerToForm(c: Customer): CustomerFormValues {
  const personType = c.personType as CustomerFormValues['personType'];
  return {
    name: c.name,
    document: formatCpfCnpj(c.document, personType),
    phone: formatPhone(c.phone ?? ''),
    email: c.email ?? '',
    personType,
    customerType: (c.customerType as CustomerFormValues['customerType']) ?? 'BUYER',
    street: c.street ?? '',
    number: c.number ?? '',
    complement: c.complement ?? '',
    neighborhood: c.neighborhood ?? '',
    city: c.city ?? '',
    state: c.state ?? '',
    zipCode: formatCep(c.zipCode ?? ''),
    notes: c.notes ?? '',
    assignedSellerId: c.assignedSellerId ?? '',
  };
}

export function CustomerForm({
  mode,
  customerId,
  initialData,
  canUpdate,
}: {
  mode: 'create' | 'edit';
  customerId?: string;
  initialData?: Customer;
  canUpdate: boolean;
}) {
  const router = useRouter();

  const sellersQuery = useQuery({
    queryKey: ['users', 'sellers'],
    queryFn: () => api.getUsers(),
  });

  const sellerOptions =
    sellersQuery.data?.data
      .filter((u) => ['SELLER', 'MANAGER', 'ADMIN'].includes(u.role))
      .map((u) => ({ value: u.id, label: u.name })) ?? [];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: initialData ? customerToForm(initialData) : emptyCustomerForm(),
  });

  useEffect(() => {
    if (initialData) reset(customerToForm(initialData));
  }, [initialData, reset]);

  const personType = watch('personType');

  useEffect(() => {
    const document = getValues('document');
    if (!document) return;
    setValue('document', formatCpfCnpj(document, personType), { shouldValidate: true });
  }, [personType, getValues, setValue]);

  async function onSubmit(values: CustomerFormValues) {
    try {
      const payload = toCustomerPayload(values);
      if (mode === 'create') {
        const created = await api.createCustomer(payload);
        toast.success('Cliente cadastrado');
        router.push(customerEditHref(created.id));
      } else if (customerId) {
        await api.updateCustomer(customerId, payload);
        toast.success('Cliente atualizado');
        router.push('/clientes');
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao salvar cliente');
    }
  }

  const readOnly = mode === 'edit' && !canUpdate;

  return (
    <div className="space-y-6">
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados do cliente</CardTitle>
            <CardDescription>Identificação e contato</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="Nome completo / Razão social" required error={errors.name?.message}>
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
              label="Tipo de cliente"
              required
              value={personType}
              onChange={(v) => setValue('personType', v as CustomerFormValues['personType'])}
              options={personOptions}
              error={errors.personType?.message}
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
            <FormSelect
              label="Perfil do cliente"
              value={watch('customerType') ?? 'BUYER'}
              onChange={(v) =>
                setValue('customerType', v as CustomerFormValues['customerType'])
              }
              options={customerTypeOptions}
            />
            <FormSelect
              label="Vendedor responsável"
              value={watch('assignedSellerId') ?? ''}
              onChange={(v) => setValue('assignedSellerId', v)}
              options={sellerOptions}
              placeholder="Nenhum"
            />
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
            <FormTextarea
              label="Notas internas"
              rows={4}
              disabled={readOnly}
              {...register('notes')}
            />
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
                'Cadastrar cliente'
              ) : (
                'Salvar alterações'
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push('/clientes')}>
              Cancelar
            </Button>
          </div>
        ) : null}
      </form>

      {mode === 'create' ? (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de compras</CardTitle>
            <CardDescription>
              Disponível após salvar o cliente — vendas vinculadas aparecerão aqui
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Cadastre o cliente e registre vendas para acompanhar o histórico de compras.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {customerId ? (
        <>
          <CustomerSalesPanel customerId={customerId} />
          <EntityHistoryPanel
            entityId={customerId}
            queryKeyPrefix="customers"
            api={{
              getHistory: api.getCustomerHistory,
              addNote: api.addCustomerHistoryNote,
            }}
            canAddNote={canUpdate}
            title="Histórico do cliente"
          />
        </>
      ) : null}
    </div>
  );
}
