'use client';

import { useQuery } from '@tanstack/react-query';
import {
  VehicleStockPhotoCell,
  vehicleStockPhotoFallback,
} from '@/components/vehicles/vehicle-stock-photo-cell';
import { useState } from 'react';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Plus, Pencil, ScanSearch, Sparkles } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { hasPermission } from '@/lib/permissions';
import { api } from '@/lib/api';
import { vehicleEditHref } from '@/lib/edit-routes';
import { formatCurrency } from '@/lib/format';
import { vehicleStatusLabels, vehicleStatusVariant } from '@/lib/labels';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ExportButtons } from '@/components/reports/export-buttons';
import { PageHeader } from '@/components/layout/page-header';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { SelectField } from '@/components/ui/select-field';
import { Card } from '@/components/ui/card';
import { BranchFilterField } from '@/components/filters/branch-filter-field';

export default function EstoquePage() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const canCreate = hasPermission(user, 'vehicles:create');
  const canUpdate = hasPermission(user, 'vehicles:update');
  const canLookupPlate = hasPermission(user, 'stock:read');
  const canPurchaseIntel = hasPermission(user, 'purchase-intelligence:read');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [status, setStatus] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ['stock', { search: debouncedSearch, status, page, branchFilter, isAdmin }],
    queryFn: () =>
      api.getStock({
        page,
        limit: 20,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(status ? { status } : {}),
        ...(isAdmin && branchFilter !== 'all' ? { branchId: branchFilter } : {}),
      }),
  });

  const items = query.data?.data ?? [];
  const meta = query.data?.meta;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estoque"
        description="Veículos disponíveis e em preparação"
      >
        {canPurchaseIntel ? (
          <Link href="/compra-inteligente" className={cn(buttonVariants({ variant: 'outline' }))}>
            <Sparkles className="h-4 w-4" />
            Compra inteligente
          </Link>
        ) : null}
        {canLookupPlate ? (
          <Link href="/estoque/consulta-placa" className={cn(buttonVariants({ variant: 'outline' }))}>
            <ScanSearch className="h-4 w-4" />
            Consulta por placa
          </Link>
        ) : null}
        {canCreate ? (
          <Link href="/veiculos/novo" className={cn(buttonVariants())}>
            <Plus className="h-4 w-4" />
            Novo cadastro
          </Link>
        ) : null}
        <ExportButtons report="stock" />
      </PageHeader>

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-500" />
          <Input
            className="pl-9"
            placeholder="Buscar marca, modelo ou placa…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <SelectField
          className="sm:w-48"
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          placeholder="Todos os status"
          aria-label="Filtrar por status do estoque"
          options={[
            { value: '', label: 'Todos os status' },
            ...Object.entries(vehicleStatusLabels).map(([key, label]) => ({
              value: key,
              label,
            })),
          ]}
        />
        {isAdmin ? (
          <BranchFilterField
            value={branchFilter}
            onChange={(v) => {
              setBranchFilter(v);
              setPage(1);
            }}
          />
        ) : null}
        </div>
      </Card>

      {query.isLoading ? (
        <p className="text-sm text-brand-600">Carregando estoque…</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Foto</TableHead>
                <TableHead>Veículo</TableHead>
                {isAdmin ? <TableHead>Filial</TableHead> : null}
                <TableHead>Placa</TableHead>
                <TableHead>Compra</TableHead>
                <TableHead>Custos</TableHead>
                <TableHead>Anunciado</TableHead>
                <TableHead>Margem prev.</TableHead>
                <TableHead>Dias</TableHead>
                <TableHead>Status</TableHead>
                {canUpdate ? <TableHead className="w-20" /> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const editHref = vehicleEditHref(item.id);
                return (
                  <TableRow
                    key={item.id}
                    className={canUpdate ? 'cursor-pointer hover:bg-brand-50/80' : undefined}
                    onClick={
                      canUpdate
                        ? (e) => {
                            const target = e.target as HTMLElement;
                            if (target.closest('a, button')) return;
                            router.push(editHref);
                          }
                        : undefined
                    }
                  >
                    <TableCell>
                      <VehicleStockPhotoCell
                        vehicleId={item.id}
                        photoUrl={item.photo?.url}
                        photoThumbUrl={item.photo?.thumbnailUrl}
                        label={vehicleStockPhotoFallback(item)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {canUpdate ? (
                        <Link
                          href={editHref}
                          className="hover:text-brand-700 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {item.brand} {item.model}
                          {item.version ? ` ${item.version}` : ''}
                        </Link>
                      ) : (
                        <>
                          {item.brand} {item.model}
                          {item.version ? ` ${item.version}` : ''}
                        </>
                      )}
                      <span className="block text-xs text-brand-600">{item.year}</span>
                    </TableCell>
                    {isAdmin ? (
                      <TableCell className="text-brand-700">{item.branchName ?? 'Matriz'}</TableCell>
                    ) : null}
                    <TableCell>{item.licensePlate ?? '—'}</TableCell>
                    <TableCell>{formatCurrency(item.purchaseValue)}</TableCell>
                    <TableCell>{formatCurrency(item.totalCosts)}</TableCell>
                    <TableCell>{formatCurrency(item.listedValue)}</TableCell>
                    <TableCell>{formatCurrency(item.expectedMargin)}</TableCell>
                    <TableCell>{item.daysInStock ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={vehicleStatusVariant(item.status)}>
                        {vehicleStatusLabels[item.status] ?? item.status}
                      </Badge>
                    </TableCell>
                    {canUpdate ? (
                      <TableCell>
                        <Link
                          href={editHref}
                          className={cn(
                            buttonVariants({ variant: 'ghost', size: 'icon' }),
                            'h-8 w-8',
                          )}
                          title="Editar veículo"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })}
              {!items.length ? (
                <TableRow>
                  <TableCell
                    colSpan={canUpdate ? (isAdmin ? 11 : 10) : isAdmin ? 10 : 9}
                    className="text-center text-brand-600"
                  >
                    Nenhum veículo encontrado
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>

          <PaginationControls meta={meta} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
