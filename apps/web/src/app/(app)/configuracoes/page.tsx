'use client';

import { useAuth } from '@/providers/auth-provider';
import { PageHeader } from '@/components/layout/page-header';
import { ConfigCard } from '@/components/settings/config-card';
import { getVisibleConfiguracoesCards } from '@/lib/configuracoes-nav';

export default function ConfiguracoesPage() {
  const { user } = useAuth();
  const visibleCards = getVisibleConfiguracoesCards(user);

  if (!visibleCards.length) {
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
        description="Cadastros, parâmetros e preferências da revenda"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleCards.map((item) => (
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
