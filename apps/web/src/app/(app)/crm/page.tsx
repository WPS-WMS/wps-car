'use client';

import { Suspense } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { CrmPanel } from '@/components/crm/crm-panel';
import { hasPermission } from '@/lib/permissions';
import { useAuth } from '@/providers/auth-provider';

function CrmPageContent() {
  const { user } = useAuth();

  if (!hasPermission(user, 'crm:read')) {
    return (
      <p className="text-sm text-brand-600">Você não tem permissão para acessar o CRM comercial.</p>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM comercial"
        description="Leads, funil de vendas, histórico de contato, follow-up e lembretes para vendedores"
      />
      <CrmPanel />
    </div>
  );
}

export default function CrmPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando…</p>}>
      <CrmPageContent />
    </Suspense>
  );
}
