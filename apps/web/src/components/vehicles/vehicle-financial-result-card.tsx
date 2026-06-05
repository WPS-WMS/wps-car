'use client';

import type { VehicleFinancialDetail } from '@/types/api';
import { formatCurrency, formatPercent } from '@/lib/format';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function VehicleFinancialResultCard({
  financial,
}: {
  financial: VehicleFinancialDetail;
}) {
  const items = [
    { label: 'Valor de compra', value: formatCurrency(financial.purchaseValue) },
    { label: 'Total de custos', value: formatCurrency(financial.totalCosts) },
    { label: 'Valor de venda', value: formatCurrency(financial.saleValue) },
    { label: 'Lucro bruto', value: formatCurrency(financial.grossProfit) },
    { label: 'Comissão paga', value: formatCurrency(financial.commissionValue) },
    { label: 'Resultado líquido', value: formatCurrency(financial.netResult) },
    { label: 'Margem em R$', value: formatCurrency(financial.marginAmount) },
    { label: 'Margem em %', value: formatPercent(financial.marginPercent) },
    { label: 'Dias em estoque', value: financial.daysInStock ?? '—' },
  ];

  return (
    <Card className="border-brand-200/80 bg-brand-50/30">
      <CardHeader>
        <CardTitle>Resultado</CardTitle>
        <CardDescription>
          Calculado automaticamente com base em compra, venda, custos e comissão
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.label} className="rounded-lg border border-brand-100 bg-white px-4 py-3">
              <dt className="text-xs font-medium text-muted-foreground">{item.label}</dt>
              <dd className="mt-1 text-lg font-semibold text-brand-900">{item.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
