'use client';

import { useState } from 'react';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Plus, MoreVertical, SlidersHorizontal } from 'lucide-react';
import { api } from '@/lib/api';
import { vehicleEditHref } from '@/lib/edit-routes';
import { useAuth } from '@/providers/auth-provider';
import { hasPermission } from '@/lib/permissions';
import {
  vehicleStatusLabels,
  vehicleStatusVariant,
  vehicleTypeLabels,
} from '@/lib/labels';
import { formatCurrency } from '@/lib/format';
import { PageHeader } from '@/components/layout/page-header';
import { SearchBar } from '@/components/ui/search-bar';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { SelectField } from '@/components/ui/select-field';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BranchFilterField } from '@/components/filters/branch-filter-field';

export default function VeiculosPage() {
  const { user, isAdmin } = useAuth();
  const canCreate = hasPermission(user, 'vehicles:create');
  const canUpdate = hasPermission(user, 'vehicles:update');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [status, setStatus] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const query = useQuery({
    queryKey: ['vehicles', 'list', { search: debouncedSearch, status, page, branchFilter, isAdmin }],
    queryFn: () =>
      api.getVehicles({
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
        title="Veículos e produtos"
        description="Gerencie seu inventário de veículos"
      >
        {canCreate ? (
          <Link href="/veiculos/novo" className={cn(buttonVariants())}>
            <Plus className="h-4 w-4" />
            Novo veículo
          </Link>
        ) : null}
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar
          className="flex-1"
          placeholder="Buscar por marca, modelo, placa…"
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
        />
        <Button
          type="button"
          variant="outline"
          className="h-11 shrink-0 bg-white"
          onClick={() => setShowFilters((s) => !s)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
        </Button>
      </div>

      {showFilters ? (
        <Card className="border border-border p-4 shadow-card">
          <label className="text-sm font-medium text-muted-foreground" htmlFor="filter-status">
            Status
          </label>
          <SelectField
            id="filter-status"
            className="mt-2 max-w-xs"
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            placeholder="Todos"
            aria-label="Filtrar por status"
            options={[
              { value: '', label: 'Todos' },
              ...Object.entries(vehicleStatusLabels).map(([k, label]) => ({
                value: k,
                label,
              })),
            ]}
          />
          {isAdmin ? (
            <div className="mt-4 max-w-xs">
              <label className="text-sm font-medium text-muted-foreground" htmlFor="filter-branch">
                Filial
              </label>
              <BranchFilterField
                value={branchFilter}
                onChange={(v) => {
                  setBranchFilter(v);
                  setPage(1);
                }}
                className="mt-2 w-full"
              />
            </div>
          ) : null}
        </Card>
      ) : null}

      {query.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando veículos…</p>
      ) : (
        <>
          <Card className="overflow-hidden border border-border shadow-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Tipo</TableHead>
                  <TableHead>Veículo</TableHead>
                  {isAdmin ? <TableHead>Filial</TableHead> : null}
                  <TableHead>Ano</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead>Cor</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Status</TableHead>
                  {canUpdate ? <TableHead className="w-12" /> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((v) => (
                  <TableRow key={v.id} className="bg-white">
                    <TableCell className="text-muted-foreground">
                      {vehicleTypeLabels[v.type] ?? v.type}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {canUpdate ? (
                        <Link
                          href={vehicleEditHref(v.id)}
                          className="hover:text-brand-600 hover:underline"
                        >
                          {v.brand} {v.model}
                        </Link>
                      ) : (
                        <>
                          {v.brand} {v.model}
                        </>
                      )}
                    </TableCell>
                    {isAdmin ? (
                      <TableCell className="text-muted-foreground">
                        {v.branchName ?? 'Matriz'}
                      </TableCell>
                    ) : null}
                    <TableCell>
                      {v.manufactureYear}/{v.modelYear}
                    </TableCell>
                    <TableCell>{v.licensePlate ?? '—'}</TableCell>
                    <TableCell>{v.color ?? '—'}</TableCell>
                    <TableCell className="font-medium text-brand-600">
                      {formatCurrency(v.financial?.listedValue ?? v.financial?.purchaseValue)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={vehicleStatusVariant(v.status)}>
                        {vehicleStatusLabels[v.status] ?? v.status}
                      </Badge>
                    </TableCell>
                    {canUpdate ? (
                      <TableCell>
                        <Link
                          href={vehicleEditHref(v.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
                          title="Editar"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Link>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
                {!items.length ? (
                  <TableRow>
                    <TableCell
                      colSpan={canUpdate ? (isAdmin ? 9 : 8) : isAdmin ? 8 : 7}
                      className="py-10 text-center text-muted-foreground"
                    >
                      Nenhum veículo encontrado
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </Card>

          <PaginationControls meta={meta} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
