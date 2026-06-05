'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { MoreVertical, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { customerEditHref } from '@/lib/edit-routes';
import { useAuth } from '@/providers/auth-provider';
import { hasPermission } from '@/lib/permissions';
import { formatAddress, personTypeLabels } from '@/lib/person-labels';
import { PageHeader } from '@/components/layout/page-header';
import { SearchBar } from '@/components/ui/search-bar';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function formatDocument(doc: string) {
  const digits = doc.replace(/\D/g, '');
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  if (digits.length === 14) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return doc;
}

export default function ClientesPage() {
  const { user } = useAuth();
  const canCreate = hasPermission(user, 'customers:create');
  const canUpdate = hasPermission(user, 'customers:update');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ['customers', 'list', { search, page }],
    queryFn: () =>
      api.getCustomers({
        page,
        limit: 20,
        ...(search ? { search } : {}),
      }),
  });

  const items = query.data?.data ?? [];
  const meta = query.data?.meta;

  return (
    <div className="space-y-6">
      <PageHeader title="Clientes" description="Clientes cadastrados na revenda">
        {canCreate ? (
          <Link href="/clientes/novo" className={cn(buttonVariants())}>
            <Plus className="h-4 w-4" />
            Novo Cliente
          </Link>
        ) : null}
      </PageHeader>

      <SearchBar
        placeholder="Buscar por nome, e-mail, telefone ou documento…"
        value={search}
        onChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
      />

      {query.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando clientes…</p>
      ) : (
        <>
          <Card className="overflow-hidden border border-border shadow-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF / CNPJ</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="hidden lg:table-cell">Endereço</TableHead>
                  <TableHead className="hidden md:table-cell">Vendedor</TableHead>
                  <TableHead>Status</TableHead>
                  {canUpdate ? <TableHead className="w-12" /> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((c) => (
                  <TableRow key={c.id} className="bg-white">
                    <TableCell className="font-medium text-foreground">
                      {canUpdate ? (
                        <Link
                          href={customerEditHref(c.id)}
                          className="hover:text-brand-600 hover:underline"
                        >
                          {c.name}
                        </Link>
                      ) : (
                        c.name
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDocument(c.document)}
                    </TableCell>
                    <TableCell>{c.phone ?? '—'}</TableCell>
                    <TableCell className="max-w-[180px] truncate">{c.email ?? '—'}</TableCell>
                    <TableCell>
                      {personTypeLabels[c.personType] ?? c.personType}
                    </TableCell>
                    <TableCell className="hidden max-w-[220px] truncate text-muted-foreground lg:table-cell">
                      {formatAddress(c)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {c.assignedSeller?.name ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.active ? 'success' : 'secondary'}>
                        {c.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    {canUpdate ? (
                      <TableCell>
                        <Link
                          href={customerEditHref(c.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
                          title="Editar cliente"
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
                      colSpan={canUpdate ? 9 : 8}
                      className="py-10 text-center text-muted-foreground"
                    >
                      Nenhum cliente encontrado
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </Card>

          {meta && meta.totalPages > 1 ? (
            <div className="flex items-center justify-between">
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
    </div>
  );
}
