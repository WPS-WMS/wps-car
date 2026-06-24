'use client';

import { useState } from 'react';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Plus, Mail, Phone, MapPin, Truck } from 'lucide-react';
import { api } from '@/lib/api';
import { supplierEditHref } from '@/lib/edit-routes';
import { useAuth } from '@/providers/auth-provider';
import { hasPermission } from '@/lib/permissions';
import { supplierCategoryLabels } from '@/lib/person-labels';
import { SettingsPageShell } from '@/components/settings/settings-page-shell';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { SearchBar } from '@/components/ui/search-bar';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { SelectField } from '@/components/ui/select-field';

export default function FornecedoresPage() {
  const { user } = useAuth();
  const canCreate = hasPermission(user, 'suppliers:create');
  const canUpdate = hasPermission(user, 'suppliers:update');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ['suppliers', 'list', { search: debouncedSearch, category, page }],
    queryFn: () =>
      api.getSuppliers({
        page,
        limit: 20,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(category ? { category } : {}),
      }),
  });

  const items = query.data?.data ?? [];
  const meta = query.data?.meta;

  return (
    <SettingsPageShell title="Fornecedores" description="Gerencie seus fornecedores">
      <div className="space-y-6">
        {canCreate ? (
          <div className="flex justify-end">
            <Link href="/fornecedores/novo" className={cn(buttonVariants())}>
              <Plus className="h-4 w-4" />
              Novo fornecedor
            </Link>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar
          className="flex-1"
          placeholder="Buscar fornecedor…"
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
        />
        <SelectField
          className="shrink-0 sm:w-56"
          value={category}
          onChange={(v) => {
            setCategory(v);
            setPage(1);
          }}
          placeholder="Todos os tipos"
          aria-label="Filtrar por tipo de fornecedor"
          options={[
            { value: '', label: 'Todos os tipos' },
            ...Object.entries(supplierCategoryLabels).map(([k, label]) => ({
              value: k,
              label,
            })),
          ]}
        />
      </div>

      {query.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando fornecedores…</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((s) => (
              <Card
                key={s.id}
                className="border border-border shadow-card transition-shadow hover:shadow-card-hover"
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                      <Truck className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      {canUpdate ? (
                        <Link
                          href={supplierEditHref(s.id)}
                          className="font-semibold text-foreground hover:text-brand-600"
                        >
                          {s.name}
                        </Link>
                      ) : (
                        <p className="font-semibold text-foreground">{s.name}</p>
                      )}
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {supplierCategoryLabels[s.category] ?? s.category}
                      </p>
                      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                        {s.email ? (
                          <li className="flex items-center gap-2">
                            <Mail className="h-4 w-4 shrink-0" />
                            <span className="truncate">{s.email}</span>
                          </li>
                        ) : null}
                        {s.phone ? (
                          <li className="flex items-center gap-2">
                            <Phone className="h-4 w-4 shrink-0" />
                            <span>{s.phone}</span>
                          </li>
                        ) : null}
                        {s.city && s.state ? (
                          <li className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 shrink-0" />
                            <span>
                              {s.city} - {s.state}
                            </span>
                          </li>
                        ) : null}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {!items.length ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Nenhum fornecedor encontrado
              </CardContent>
            </Card>
          ) : null}

          <PaginationControls meta={meta} onPageChange={setPage} />
        </>
      )}
      </div>
    </SettingsPageShell>
  );
}
