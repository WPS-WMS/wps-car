'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Car,
  Clock,
  DollarSign,
  Package,
  Percent,
  ShoppingCart,
  TrendingUp,
  Wallet,
  Wrench,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency, formatPercent } from '@/lib/format';
import {
  defaultPeriodFilter,
  formatPeriodDescription,
  periodMetricTitles,
  resolvePeriodRange,
  type PeriodFilterValue,
} from '@/lib/date-period';
import { useAuth } from '@/providers/auth-provider';
import { StatCard } from '@/components/dashboard/stat-card';
import { SellerRankingTable } from '@/components/dashboard/seller-ranking-table';
import { VehicleListCard } from '@/components/vehicles/vehicle-list-card';
import { PageHeader } from '@/components/layout/page-header';
import { SalesPeriodFilter } from '@/components/sales/sales-period-filter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const { isManager } = useAuth();
  const [periodFilter, setPeriodFilter] = useState<PeriodFilterValue>(defaultPeriodFilter);

  const periodRange = useMemo(
    () => resolvePeriodRange(periodFilter),
    [periodFilter],
  );

  const periodParams = periodRange
    ? { startDate: periodRange.startDate, endDate: periodRange.endDate }
    : undefined;

  const metricTitles = periodMetricTitles(periodFilter.preset);
  const periodDescription = formatPeriodDescription(periodFilter, periodRange);

  const manager = useQuery({
    queryKey: ['dashboard', 'manager', periodParams],
    queryFn: () => api.getManagerDashboard(periodParams),
    enabled: isManager,
  });

  const ranking = useQuery({
    queryKey: ['dashboard', 'seller-ranking', periodParams],
    queryFn: () => api.getSellerRanking(periodParams),
    enabled: isManager,
  });

  const seller = useQuery({
    queryKey: ['dashboard', 'seller', periodParams],
    queryFn: () => api.getSellerDashboard(periodParams),
    enabled: !isManager,
  });

  const recentStock = useQuery({
    queryKey: ['stock', 'recent'],
    queryFn: () => api.getStock({ page: 1, limit: 6 }),
  });

  const loading = isManager ? manager.isLoading : seller.isLoading;
  const m = manager.data;
  const s = seller.data;

  return (
    <div className="space-y-8">
      <PageHeader
        title={isManager ? 'Dashboard gerencial' : 'Meu desempenho'}
        description={
          isManager
            ? 'Indicadores de estoque, vendas e ranking da equipe'
            : 'Suas vendas e comissões no período selecionado'
        }
      />

      <SalesPeriodFilter
        value={periodFilter}
        onChange={setPeriodFilter}
        description={periodDescription}
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando métricas…</p>
      ) : isManager && m ? (
        <>
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Indicadores de estoque</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <StatCard
                title="Veículos em estoque"
                value={String(m.stock.totalStock)}
                icon={Car}
                tone="blue"
              />
              <StatCard
                title="Investimento em estoque"
                value={formatCurrency(m.stock.totalInvestment)}
                icon={Wallet}
                tone="purple"
              />
              <StatCard
                title="Custos acumulados"
                value={formatCurrency(m.stock.totalCosts)}
                icon={Wrench}
                tone="orange"
              />
              <StatCard
                title="Potencial de venda"
                value={formatCurrency(m.stock.totalListedValue)}
                hint="Soma dos valores anunciados"
                icon={Package}
                tone="green"
              />
              <StatCard
                title="Tempo médio em estoque"
                value={`${m.stock.averageStockDaysInStock} dias`}
                hint="Média dos itens atuais no estoque"
                icon={Clock}
                tone="blue"
              />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              Indicadores de vendas
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <StatCard
                title={metricTitles.sales}
                value={String(m.sales.salesCount)}
                icon={ShoppingCart}
                tone="green"
              />
              <StatCard
                title="Receita total"
                value={formatCurrency(m.sales.totalRevenue)}
                icon={TrendingUp}
                tone="purple"
              />
              <StatCard
                title="Lucro bruto"
                value={formatCurrency(m.sales.totalGrossProfit)}
                icon={DollarSign}
                tone="green"
              />
              <StatCard
                title="Margem média"
                value={formatPercent(m.sales.averageMarginPercent)}
                icon={Percent}
                tone="blue"
              />
              <StatCard
                title="Ticket médio"
                value={formatCurrency(m.sales.averageTicket)}
                icon={DollarSign}
                tone="orange"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                title="Tempo médio até a venda"
                value={`${m.sales.averageDaysInStock} dias`}
                hint="Média das vendas finalizadas no período"
                icon={Clock}
                tone="blue"
              />
              <StatCard
                title="Comissões no período"
                value={formatCurrency(m.sales.totalCommission)}
                icon={Wallet}
                tone="purple"
              />
              <StatCard
                title="Resultado líquido"
                value={formatCurrency(m.sales.totalNetProfit)}
                hint="Após comissões"
                icon={TrendingUp}
                tone="green"
              />
            </div>
          </section>

          <SellerRankingTable data={ranking.data} loading={ranking.isLoading} />
        </>
      ) : !isManager && s ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title={metricTitles.sales}
            value={String(s.vehiclesSold)}
            icon={ShoppingCart}
            tone="green"
          />
          <StatCard
            title="Receita total"
            value={formatCurrency(s.totalRevenue)}
            icon={TrendingUp}
            tone="purple"
          />
          <StatCard
            title="Comissão total"
            value={formatCurrency(s.totalCommission)}
            icon={Wallet}
            tone="orange"
          />
          <StatCard
            title="Conversão"
            value={formatPercent(s.conversionRate)}
            hint={`${s.vehiclesSold} vendas de ${s.totalNegotiations} negociações`}
            icon={Percent}
            tone="blue"
          />
        </div>
      ) : null}

      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Veículos recentes no estoque</h2>
        {recentStock.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(recentStock.data?.data ?? []).map((item) => (
              <VehicleListCard key={item.id} item={item} />
            ))}
            {!recentStock.data?.data.length ? (
              <Card className="col-span-full border-dashed">
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  Nenhum veículo no estoque
                </CardContent>
              </Card>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
