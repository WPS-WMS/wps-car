'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { vehicleEditHref } from '@/lib/edit-routes';
import { formatCurrency, formatDate } from '@/lib/format';
import { vehicleStatusLabels, vehicleStatusVariant } from '@/lib/labels';
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

export function SupplierPurchasesPanel({ supplierId }: { supplierId: string }) {
  const query = useQuery({
    queryKey: ['suppliers', supplierId, 'purchases'],
    queryFn: () => api.getSupplierPurchases(supplierId),
  });

  const items = query.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Veículos comprados</CardTitle>
        <CardDescription>Entradas de estoque vinculadas a este fornecedor</CardDescription>
      </CardHeader>
      <CardContent>
        {query.isLoading ? (
          <p className="text-sm text-brand-600">Carregando…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-brand-600">
            Nenhum veículo vinculado a este fornecedor no financeiro.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data compra</TableHead>
                <TableHead>Veículo</TableHead>
                <TableHead>Ano</TableHead>
                <TableHead>Valor compra</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((row) => (
                <TableRow key={row.vehicleId}>
                  <TableCell>{formatDate(row.purchaseDate)}</TableCell>
                  <TableCell>
                    <Link
                      href={vehicleEditHref(row.vehicleId)}
                      className="font-medium hover:underline"
                    >
                      {row.brand} {row.model}
                      {row.licensePlate ? ` · ${row.licensePlate}` : ''}
                    </Link>
                  </TableCell>
                  <TableCell>{row.modelYear}</TableCell>
                  <TableCell>{formatCurrency(row.purchaseValue)}</TableCell>
                  <TableCell>
                    <Badge variant={vehicleStatusVariant(row.status)}>
                      {vehicleStatusLabels[row.status] ?? row.status}
                    </Badge>
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
