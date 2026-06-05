'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { vehicleEditHref } from '@/lib/edit-routes';
import { formatCurrency, formatDate } from '@/lib/format';
import { saleStatusLabels, saleStatusVariant } from '@/lib/labels';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function CustomerSalesPanel({ customerId }: { customerId: string }) {
  const query = useQuery({
    queryKey: ['sales', 'customer', customerId],
    queryFn: () => api.getSales({ customerId, limit: 50, page: 1 }),
  });

  const sales = query.data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de compras</CardTitle>
        <CardDescription>Vendas vinculadas a este cliente</CardDescription>
      </CardHeader>
      <CardContent>
        {query.isLoading ? (
          <p className="text-sm text-brand-600">Carregando compras…</p>
        ) : sales.length === 0 ? (
          <p className="text-sm text-brand-600">Nenhuma venda registrada para este cliente.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Veículo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Vendedor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{formatDate(sale.saleDate)}</TableCell>
                  <TableCell>
                    {sale.vehicle ? (
                      <Link href={vehicleEditHref(sale.vehicleId)} className="hover:underline">
                        {sale.vehicle.brand} {sale.vehicle.model}
                        {sale.vehicle.licensePlate
                          ? ` · ${sale.vehicle.licensePlate}`
                          : ''}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>{formatCurrency(sale.amount)}</TableCell>
                  <TableCell>
                    <Badge variant={saleStatusVariant(sale.status)}>
                      {saleStatusLabels[sale.status] ?? sale.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{sale.seller?.name ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
