'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ShoppingCart, DollarSign, TrendingUp, Pencil } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import {
  defaultPeriodFilter,
  formatPeriodDescription,
  periodMetricTitles,
  resolvePeriodRange,
  type PeriodFilterValue,
} from '@/lib/date-period';
import { paymentMethodLabels, saleStatusLabels, saleStatusVariant } from '@/lib/labels';
import { useAuth } from '@/providers/auth-provider';
import {
  AnalyticsScopeFilter,
  analyticsScopeParams,
  emptyAnalyticsScope,
  scopeQueryKey,
} from '@/components/analytics/analytics-scope-filter';
import { hasPermission } from '@/lib/permissions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SaleFormDialog } from '@/components/sales/sale-form-dialog';
import { SaleEditDialog } from '@/components/sales/sale-edit-dialog';
import { SalesPeriodFilter } from '@/components/sales/sales-period-filter';
import { ExportButtons } from '@/components/reports/export-buttons';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/dashboard/stat-card';
import { SearchBar } from '@/components/ui/search-bar';
import { SelectField } from '@/components/ui/select-field';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function VendasPage() {
  const { user, isManager, isAdmin } = useAuth();
  const [scope, setScope] = useState(emptyAnalyticsScope);
  const canRead = hasPermission(user, 'sales:read');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [editSaleId, setEditSaleId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
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
  const scopeParams = analyticsScopeParams(scope, isAdmin);

  const managerDash = useQuery({
    queryKey: ['dashboard', 'manager', periodParams, scopeQueryKey(scope)],
    queryFn: () => api.getManagerDashboard({ ...periodParams, ...scopeParams }),
    enabled: isManager && !!periodRange,
  });

  const sellerDash = useQuery({
    queryKey: ['dashboard', 'seller', periodParams],
    queryFn: () => api.getSellerDashboard(periodParams),
    enabled: !isManager && !!periodRange,
  });

  const metricsLoading =
    (isManager ? managerDash.isFetching : sellerDash.isFetching) && !!periodRange;

  const query = useQuery({
    queryKey: ['sales', { search, status, page, ...scopeQueryKey(scope) }],
    queryFn: () =>
      api.getSales({
        page,
        limit: 20,
        ...(search ? { search } : {}),
        ...(status ? { status } : {}),
        ...scopeParams,
      }),
    enabled: canRead,
  });

  const items = query.data?.data ?? [];
  const meta = query.data?.meta;

  const salesCount = isManager
    ? managerDash.data?.sales.salesCount
    : sellerDash.data?.vehiclesSold;
  const revenue = isManager
    ? managerDash.data?.sales.totalRevenue
    : sellerDash.data?.totalRevenue;
  const profit = isManager
    ? managerDash.data?.sales.totalGrossProfit ?? managerDash.data?.sales.totalProfit
    : null;

  function openSale(id: string) {
    setEditSaleId(id);
    setEditOpen(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendas"
        description="Registre negociações, acompanhe pagamentos e comissões"
      >
        <ExportButtons
          report="sales"
          params={{
            ...(status ? { status } : {}),
            ...(periodParams ?? {}),
          }}
        />
        <SaleFormDialog />
      </PageHeader>

      <div className="space-y-4">
        <SalesPeriodFilter
          value={periodFilter}
          onChange={setPeriodFilter}
          description={periodDescription}
        />
        {isManager ? (
          <AnalyticsScopeFilter value={scope} onChange={setScope} />
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title={metricTitles.sales}
          value={metricsLoading ? '…' : String(salesCount ?? '—')}
          icon={ShoppingCart}
          tone="green"
        />
        <StatCard
          title={metricTitles.revenue}
          value={metricsLoading ? '…' : formatCurrency(revenue)}
          icon={DollarSign}
          tone="purple"
        />
        <StatCard
          title={metricTitles.profit}
          value={metricsLoading ? '…' : formatCurrency(profit)}
          icon={TrendingUp}
          tone="blue"
          hint={isManager ? undefined : 'Visível para gerentes'}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar
          className="flex-1"
          placeholder="Buscar cliente, veículo…"
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
        />
        <SelectField
          className="shrink-0 sm:w-52"
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          placeholder="Todos os status"
          aria-label="Filtrar por status da venda"
          options={[
            { value: '', label: 'Todos os status' },
            ...Object.entries(saleStatusLabels).map(([key, label]) => ({
              value: key,
              label,
            })),
          ]}
        />
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Vendas recentes</h2>
        {query.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando vendas…</p>
        ) : (
          <>
            <Card className="overflow-hidden border border-border shadow-card">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead>Veículo</TableHead>
                      <TableHead>Cliente</TableHead>
                      {isManager ? <TableHead>Vendedor</TableHead> : null}
                      <TableHead>Data</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead>Comissão</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-24" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((sale) => (
                      <TableRow key={sale.id} className="bg-white">
                        <TableCell className="font-medium">
                          {sale.vehicle
                            ? `${sale.vehicle.brand} ${sale.vehicle.model}`
                            : '—'}
                          {sale.vehicle?.licensePlate ? (
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                              {sale.vehicle.licensePlate}
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell>{sale.customer?.name ?? '—'}</TableCell>
                        {isManager ? (
                          <TableCell className="text-sm">
                            {sale.seller?.name ?? '—'}
                          </TableCell>
                        ) : null}
                        <TableCell>{formatDate(sale.saleDate)}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(sale.amount)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {paymentMethodLabels[sale.paymentMethod] ?? sale.paymentMethod}
                        </TableCell>
                        <TableCell className="text-sm">
                          {sale.commission ? formatCurrency(sale.commission) : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={saleStatusVariant(sale.status)}>
                            {saleStatusLabels[sale.status] ?? sale.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            aria-label="Ver ou editar venda"
                            onClick={() => openSale(sale.id)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!items.length ? (
                      <TableRow>
                        <TableCell
                          colSpan={isManager ? 9 : 8}
                          className="py-10 text-center text-muted-foreground"
                        >
                          Nenhuma venda encontrada
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {meta && meta.totalPages > 1 ? (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Página {meta.page} de {meta.totalPages} ({meta.total} itens)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!meta.hasPreviousPage}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!meta.hasNextPage}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </section>

      <SaleEditDialog
        saleId={editSaleId}
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditSaleId(null);
        }}
      />
    </div>
  );
}
