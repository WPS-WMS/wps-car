'use client';

import { useAuth } from '@/providers/auth-provider';
import { hasPermission } from '@/lib/permissions';
import { PageHeader } from '@/components/layout/page-header';
import { ConfigCard } from '@/components/settings/config-card';
import { configuracoesCards } from '@/lib/configuracoes-nav';

export default function ConfiguracoesPage() {
  const { user } = useAuth();
  const canRead = hasPermission(user, 'settings:read');

  if (!canRead) {
    return (
      <p className="text-sm text-brand-600">
        Você não tem permissão para acessar as configurações.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Selecione um módulo para configurar a revenda"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {configuracoesCards.map((item) => (
          <ConfigCard
            key={item.href}
            href={item.href}
            title={item.title}
            description={item.description}
            icon={item.icon}
          />
        ))}
      </div>
    </div>
  );
}
