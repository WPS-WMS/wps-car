'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageContainer } from '@/components/ui/page-container';
import { Toolbar } from '@/components/ui/toolbar';
import { SelectField } from '@/components/ui/select-field';
import { Card } from '@/components/ui/card';
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

function formatPercent2(value: string | null | undefined) {
  if (value === null || value === undefined || value === '') return '—';
  const num = parseFloat(value);
  if (Number.isNaN(num)) return '—';
  return `${num.toFixed(2)}%`;
}

export default function GeneralReportPage() {
  const { isAdmin, isManager } = useAuth();
  const [period, setPeriod] = useState(defaultPeriodFilter());
  const [scope, setScope] = useState(emptyAnalyticsScope);
  const [vehicleType, setVehicleType] = useState('');
  const [status, setStatus] = useState('');

  const range = useMemo(() => resolvePeriodRange(period), [period]);

  const scopeParams = analyticsScopeParams(scope, isAdmin);

  const reportQuery = useQuery({
    queryKey: [
      'general-report',
      range?.startDate,
      range?.endDate,
      scopeQueryKey(scope),
      vehicleType,
      status,
    ],
    enabled: Boolean(range),
    queryFn: async () =>
      api.getGeneralReport({
        startDate: range!.startDate,
        endDate: range!.endDate,
        ...scopeParams,
        vehicleType: vehicleType || undefined,
        status: status || undefined,
      }),
  });

  const data = reportQuery.data;

  const indicators = [
    { label: 'Receita total', value: formatCurrency(data?.totalRevenue) },
    { label: 'Custo total de aquisição', value: formatCurrency(data?.totalAcquisitionCost) },
    {
      label: 'Custos operacionais vinculados',
      value: formatCurrency(data?.totalOperationalCosts),
    },
    { label: 'Lucro bruto', value: formatCurrency(data?.grossProfit) },
    { label: 'Margem bruta', value: formatPercent2(data?.grossMarginPercent) },
    { label: 'Comissão total', value: formatCurrency(data?.totalCommission) },
    { label: 'Resultado líquido estimado', value: formatCurrency(data?.estimatedNetResult) },
  ];

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Relatório geral</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatPeriodDescription(period, range)}
          {data ? ` • ${data.salesCount} venda(s) no período` : ''}
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

      {reportQuery.isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Carregando relatório…</p>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {indicators.map((item) => (
            <Card key={item.label} className="border border-border p-4 shadow-card">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-2xl font-semibold">{item.value}</p>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
