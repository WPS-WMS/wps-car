'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageContainer } from '@/components/ui/page-container';
import { Toolbar } from '@/components/ui/toolbar';
import { SelectField } from '@/components/ui/select-field';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import {
  AnalyticsScopeFilter,
  analyticsScopeParams,
  emptyAnalyticsScope,
  scopeQueryKey,
} from '@/components/analytics/analytics-scope-filter';
import { saleStatusLabels, vehicleTypeLabels } from '@/lib/labels';
import { defaultPeriodFilter, formatPeriodDescription, resolvePeriodRange } from '@/lib/date-period';
import { SalesPeriodFilter } from '@/components/sales/sales-period-filter';
import { formatCurrency } from '@/lib/format';

function saleStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'CANCELLED') return 'destructive';
  if (status === 'COMPLETED') return 'default';
  if (status === 'SOLD') return 'secondary';
  return 'outline';
}

export default function CommissionReportPage() {
  const { user, isManager, isAdmin } = useAuth();
  const isSeller = user?.role === 'SELLER';

  const [period, setPeriod] = useState(defaultPeriodFilter());
  const [scope, setScope] = useState(emptyAnalyticsScope);
  const [vehicleType, setVehicleType] = useState('');
  const [status, setStatus] = useState('');

  const range = useMemo(() => resolvePeriodRange(period), [period]);

  const scopeParams = isSeller ? {} : analyticsScopeParams(scope, isAdmin);

  const reportQuery = useQuery({
    queryKey: [
      'commission-report',
      range?.startDate,
      range?.endDate,
      scopeQueryKey(scope),
      vehicleType,
      status,
    ],
    enabled: Boolean(range),
    queryFn: async () =>
      api.getCommissionReport({
        startDate: range!.startDate,
        endDate: range!.endDate,
        ...scopeParams,
        vehicleType: vehicleType || undefined,
        status: status || undefined,
      }),
  });

  const summary = reportQuery.data?.summary;
  const rows = reportQuery.data?.rows ?? [];

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Relatório de comissão</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatPeriodDescription(period, range)} • {rows.length} venda(s)
        </p>
      </div>

      <Toolbar
        left={
          <div className="flex w-full flex-col gap-3 md:flex-row md:items-end md:gap-4">
            <div className="min-w-0 flex-1">
              <SalesPeriodFilter value={period} onChange={setPeriod} />
            </div>
            <div className="flex flex-wrap items-end gap-3">
              {isManager ? (
                <AnalyticsScopeFilter
                  value={scope}
                  onChange={setScope}
                  className="flex flex-wrap items-end gap-3"
                />
              ) : null}
              <SelectField
                className="w-full sm:w-56"
                value={vehicleType}
                onChange={setVehicleType}
                placeholder="Tipo"
                aria-label="Filtrar por tipo de veículo"
                options={[
                  { value: '', label: 'Todos os tipos' },
                  ...Object.entries(vehicleTypeLabels).map(([key, label]) => ({ value: key, label })),
                ]}
              />
              <SelectField
                className="w-full sm:w-56"
                value={status}
                onChange={setStatus}
                placeholder="Status"
                aria-label="Filtrar por status da venda"
                options={[
                  { value: '', label: 'Todos os status' },
                  ...Object.entries(saleStatusLabels).map(([key, label]) => ({ value: key, label })),
                ]}
              />
            </div>
          </div>
        }
      />

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-border p-4 shadow-card">
          <p className="text-xs text-muted-foreground">Veículos vendidos</p>
          <p className="mt-1 text-2xl font-semibold">{summary?.vehiclesSold ?? '—'}</p>
        </Card>
        <Card className="border border-border p-4 shadow-card">
          <p className="text-xs text-muted-foreground">Valor total vendido</p>
          <p className="mt-1 text-2xl font-semibold">
            {summary ? formatCurrency(summary.totalSalesAmount) : '—'}
          </p>
        </Card>
        <Card className="border border-border p-4 shadow-card">
          <p className="text-xs text-muted-foreground">Lucro total gerado</p>
          <p className="mt-1 text-2xl font-semibold">
            {summary ? formatCurrency(summary.totalProfit) : '—'}
          </p>
        </Card>
        <Card className="border border-border p-4 shadow-card">
          <p className="text-xs text-muted-foreground">Comissão total no período</p>
          <p className="mt-1 text-2xl font-semibold">
            {summary ? formatCurrency(summary.totalCommission) : '—'}
          </p>
        </Card>
      </div>

      <div className="mt-6">
        <Card className="overflow-hidden border border-border shadow-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Veículo</TableHead>
                  {isManager ? <TableHead>Vendedor</TableHead> : null}
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Lucro</TableHead>
                  <TableHead>Comissão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={isManager ? 7 : 6} className="py-10 text-center text-muted-foreground">
                      Carregando relatório…
                    </TableCell>
                  </TableRow>
                ) : rows.length ? (
                  rows.map((r) => (
                    <TableRow key={r.id} className="bg-white">
                      <TableCell className="font-medium">
                        {r.vehicle ? `${r.vehicle.brand} ${r.vehicle.model}` : '—'}
                        {r.vehicle?.licensePlate ? (
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {r.vehicle.licensePlate} • {vehicleTypeLabels[r.vehicle.type] ?? r.vehicle.type}
                          </span>
                        ) : r.vehicle?.type ? (
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {vehicleTypeLabels[r.vehicle.type] ?? r.vehicle.type}
                          </span>
                        ) : null}
                      </TableCell>
                      {isManager ? <TableCell className="text-sm">{r.seller?.name ?? '—'}</TableCell> : null}
                      <TableCell className="text-sm">{new Date(r.saleDate).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>
                        <Badge variant={saleStatusVariant(r.status)}>
                          {saleStatusLabels[r.status] ?? r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(r.amount)}</TableCell>
                      <TableCell className="text-sm">{r.profit ? formatCurrency(r.profit) : '—'}</TableCell>
                      <TableCell className="text-sm">{r.commission ? formatCurrency(r.commission) : '—'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={isManager ? 7 : 6} className="py-10 text-center text-muted-foreground">
                      Nenhum resultado para os filtros selecionados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}

