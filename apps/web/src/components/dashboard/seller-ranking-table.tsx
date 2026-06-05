'use client';

import type { SellerRanking } from '@/types/api';
import { formatCurrency, formatPercent } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function SellerRankingTable({
  data,
  loading,
}: {
  data?: SellerRanking;
  loading?: boolean;
}) {
  const rows = data?.ranking ?? [];

  return (
    <Card className="border border-border shadow-card">
      <CardHeader>
        <CardTitle className="text-base">Ranking de vendedores</CardTitle>
        <p className="text-sm text-muted-foreground">
          Ordenado por receita no período. Conversão = vendas finalizadas ÷ negociações
          (CRM futuro poderá refinar oportunidades).
        </p>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0 sm:p-6 sm:pt-0">
        {loading ? (
          <p className="px-6 pb-6 text-sm text-muted-foreground">Carregando ranking…</p>
        ) : rows.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-muted-foreground">
            Nenhuma venda finalizada no período.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead className="text-right">Vendas</TableHead>
                <TableHead className="text-right">Receita</TableHead>
                <TableHead className="text-right">Lucro bruto</TableHead>
                <TableHead className="text-right">Margem média</TableHead>
                <TableHead className="text-right">Comissão</TableHead>
                <TableHead className="text-right">Conversão</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.seller?.id ?? row.position}>
                  <TableCell className="font-medium">{row.position}</TableCell>
                  <TableCell>
                    <div className="font-medium">{row.seller?.name ?? '—'}</div>
                    {row.seller?.email ? (
                      <div className="text-xs text-muted-foreground">{row.seller.email}</div>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right">{row.salesCount}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(row.totalRevenue)}
                  </TableCell>
                  <TableCell className="text-right text-emerald-700">
                    {formatCurrency(row.totalGrossProfit)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPercent(row.averageMarginPercent)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(row.totalCommission)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPercent(row.conversionRate)}
                    <span className="block text-xs text-muted-foreground">
                      {row.salesCount}/{row.totalNegotiations} neg.
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
