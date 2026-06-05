'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { PageContainer } from '@/components/ui/page-container';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { hasPermission } from '@/lib/permissions';

export default function ReportsHubPage() {
  const { user } = useAuth();
  const canGeneral = hasPermission(user, 'reports:read');
  const canCommission = hasPermission(user, 'commissions:read');

  const cards = [
    canGeneral
      ? {
          href: '/relatorios/geral',
          title: 'Relatório geral',
          description: 'Receita, custos, lucro e resultado líquido da empresa.',
        }
      : null,
    canCommission
      ? {
          href: '/relatorios/comissoes',
          title: 'Relatório de comissão',
          description: 'Vendas, lucro gerado e comissão por período.',
        }
      : null,
  ].filter(Boolean) as { href: string; title: string; description: string }[];

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Relatórios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acompanhe os resultados e indicadores da revenda.
        </p>
      </div>

      <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3')}>
        {cards.map((card) => (
          <Link key={card.href} href={card.href} className="group">
            <Card className="border border-border p-5 shadow-card transition-all group-hover:-translate-y-0.5 group-hover:shadow-lg">
              <p className="text-sm font-semibold">{card.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{card.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}
