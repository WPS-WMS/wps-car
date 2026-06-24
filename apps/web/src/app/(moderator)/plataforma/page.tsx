'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  Car,
  DollarSign,
  ShoppingCart,
  Store,
  Users,
  UserCheck,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { formatCnpj } from '@/lib/br-input-masks';
import {
  subscriptionPlanLabel,
  tenantStatusClass,
  tenantStatusLabel,
} from '@/lib/tenant-labels';
import { PageHeader } from '@/components/layout/page-header';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { StatCard } from '@/components/dashboard/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 10;

export default function PlataformaPage() {
  const [page, setPage] = useState(1);

  const metrics = useQuery({
    queryKey: ['platform', 'metrics', page],
    queryFn: () => api.getPlatformMetrics({ page, limit: PAGE_SIZE }),
  });

  const data = metrics.data;
  const totals = data?.totals;
  const meta = data?.meta;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Métricas da plataforma"
        description="Acompanhe a utilização das empresas e indicadores para cobrança do SaaS"
      />

      {metrics.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando métricas…</p>
      ) : metrics.isError ? (
        <p className="text-sm text-destructive">Não foi possível carregar as métricas.</p>
      ) : data && totals ? (
        <>
          <p className="text-sm text-muted-foreground">
            Período de referência: <span className="font-medium text-foreground">{data.period.label}</span>
          </p>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Resumo geral</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Empresas ativas"
                value={String(totals.tenantCount)}
                icon={Building2}
                tone="blue"
              />
              <StatCard
                title="Usuários ativos"
                value={String(totals.activeUsers)}
                hint={`${totals.totalUsers} cadastrados no total`}
                icon={UserCheck}
                tone="green"
              />
              <StatCard
                title="Vendas no período"
                value={String(totals.salesInPeriod)}
                icon={ShoppingCart}
                tone="purple"
              />
              <StatCard
                title="Receita no período"
                value={formatCurrency(totals.revenueInPeriod)}
                icon={DollarSign}
                tone="orange"
              />
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-foreground">Por empresa</h2>
            </div>
            <div className="grid gap-6">
              {data.tenants.map(({ tenant, usage }) => (
                <Card key={tenant.id} className="border border-border shadow-card">
                  <CardHeader className="border-b border-border/60 pb-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <CardTitle className="text-xl">{tenant.name}</CardTitle>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatCnpj(tenant.cnpj)} · {tenant.email}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                            tenantStatusClass(tenant.status),
                          )}
                        >
                          {tenantStatusLabel(tenant.status)}
                        </span>
                        <span className="inline-flex rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
                          Plano {subscriptionPlanLabel(tenant.plan)}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <StatCard
                        title="Usuários ativos"
                        value={String(usage.activeUsers)}
                        hint={`${usage.totalUsers} no total`}
                        icon={Users}
                        tone="blue"
                      />
                      <StatCard
                        title="Filiais"
                        value={String(usage.branches)}
                        icon={Store}
                        tone="green"
                      />
                      <StatCard
                        title="Veículos em estoque"
                        value={String(usage.stockVehicles)}
                        hint={`${usage.vehicles} cadastrados`}
                        icon={Car}
                        tone="purple"
                      />
                      <StatCard
                        title="Vendas no período"
                        value={String(usage.salesInPeriod)}
                        hint={formatCurrency(usage.revenueInPeriod)}
                        icon={ShoppingCart}
                        tone="orange"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <PaginationControls
              meta={meta}
              onPageChange={setPage}
              itemLabel="empresas"
              align="end"
            />
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Tabela comparativa</h2>
            <Card className="border border-border shadow-card">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Usuários</TableHead>
                      <TableHead className="text-right">Filiais</TableHead>
                      <TableHead className="text-right">Estoque</TableHead>
                      <TableHead className="text-right">Clientes</TableHead>
                      <TableHead className="text-right">Vendas</TableHead>
                      <TableHead className="text-right">Receita</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.tenants.map(({ tenant, usage }) => (
                      <TableRow key={tenant.id}>
                        <TableCell className="font-medium">{tenant.name}</TableCell>
                        <TableCell>{subscriptionPlanLabel(tenant.plan)}</TableCell>
                        <TableCell>{tenantStatusLabel(tenant.status)}</TableCell>
                        <TableCell className="text-right">
                          {usage.activeUsers}/{usage.totalUsers}
                        </TableCell>
                        <TableCell className="text-right">{usage.branches}</TableCell>
                        <TableCell className="text-right">{usage.stockVehicles}</TableCell>
                        <TableCell className="text-right">{usage.customers}</TableCell>
                        <TableCell className="text-right">{usage.salesInPeriod}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(usage.revenueInPeriod)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </section>
        </>
      ) : null}
    </div>
  );
}
