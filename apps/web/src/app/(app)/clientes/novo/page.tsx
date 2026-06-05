'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { hasPermission } from '@/lib/permissions';
import { BackLink } from '@/components/layout/back-link';
import { PageHeader } from '@/components/layout/page-header';
import { CustomerForm } from '@/components/cadastro/customer-form';

export default function NovoClientePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const canCreate = hasPermission(user, 'customers:create');
  const canUpdate = hasPermission(user, 'customers:update');

  useEffect(() => {
    if (!isLoading && !canCreate) router.replace('/clientes');
  }, [isLoading, canCreate, router]);

  if (isLoading || !canCreate) {
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  }

  return (
    <div className="space-y-6">
      <BackLink href="/clientes" label="Voltar para clientes" />
      <PageHeader
        title="Novo Cliente"
        description="Cadastro de pessoa física ou jurídica"
      />
      <CustomerForm mode="create" canUpdate={canUpdate} />
    </div>
  );
}
