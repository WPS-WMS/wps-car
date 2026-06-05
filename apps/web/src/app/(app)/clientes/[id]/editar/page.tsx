'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { hasPermission } from '@/lib/permissions';
import { BackLink } from '@/components/layout/back-link';
import { PageHeader } from '@/components/layout/page-header';
import { CustomerForm } from '@/components/cadastro/customer-form';

export default function EditarClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const canRead = hasPermission(user, 'customers:read');
  const canUpdate = hasPermission(user, 'customers:update');

  const query = useQuery({
    queryKey: ['customers', id],
    queryFn: () => api.getCustomer(id),
    enabled: !!id && canRead,
  });

  if (!canRead) {
    return <p className="text-sm text-brand-600">Sem permissão para visualizar clientes.</p>;
  }

  if (query.isLoading) {
    return <p className="text-sm text-brand-600">Carregando cliente…</p>;
  }

  if (query.isError || !query.data) {
    return <p className="text-sm text-destructive">Cliente não encontrado.</p>;
  }

  const c = query.data;

  return (
    <div className="space-y-6">
      <BackLink href="/clientes" label="Voltar para clientes" />
      <PageHeader title="Editar cliente" description={c.name} />
      <CustomerForm
        mode="edit"
        customerId={id}
        initialData={c}
        canUpdate={canUpdate}
      />
    </div>
  );
}
