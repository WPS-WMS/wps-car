'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { hasPermission } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FormField } from '@/components/vehicles/form-field';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

function formatCnpj(cnpj: string) {
  const d = cnpj.replace(/\D/g, '');
  if (d.length !== 14) return cnpj;
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

export function StoreManagement() {
  const { user } = useAuth();
  const canUpdate = hasPermission(user, 'settings:update');
  const queryClient = useQueryClient();
  const [activeOnly, setActiveOnly] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  const tenantId = user?.tenantId ?? null;

  const tenantQuery = useQuery({
    queryKey: ['tenant-me', tenantId],
    queryFn: () => api.getCurrentTenant(),
    enabled: !!tenantId,
  });

  const branchesQuery = useQuery({
    queryKey: ['tenant-branches', tenantId, { activeOnly }],
    queryFn: () => api.getTenantBranches(activeOnly),
    enabled: !!tenantId,
  });

  const create = useMutation({
    mutationFn: () =>
      api.createTenantBranch({
        name: name.trim(),
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Filial cadastrada');
      queryClient.invalidateQueries({ queryKey: ['tenant-branches'] });
      setOpen(false);
      setName('');
      setAddress('');
      setPhone('');
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao cadastrar filial');
    },
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => api.deactivateTenantBranch(id),
    onSuccess: () => {
      toast.success('Filial inativada');
      queryClient.invalidateQueries({ queryKey: ['tenant-branches'] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao inativar');
    },
  });

  const tenant = tenantQuery.data;
  const branches = branchesQuery.data ?? [];

  return (
    <div className="space-y-4">
      <Card className="border border-border bg-brand-50/30 shadow-card">
        <CardContent className="flex gap-4 p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1 space-y-1 text-sm">
            <p className="font-semibold text-foreground">Matriz (tenant)</p>
            {tenantQuery.isLoading ? (
              <p className="text-muted-foreground">Carregando empresa…</p>
            ) : tenant ? (
              <>
                <p className="text-foreground">{tenant.name}</p>
                <p className="text-muted-foreground">
                  CNPJ {formatCnpj(tenant.cnpj)} · {tenant.email}
                </p>
                <p className="text-muted-foreground">
                  A empresa em que você está logado é a matriz. As filiais abaixo ficam
                  vinculadas a este tenant e poderão ser usadas em filtros e relatórios.
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">Não foi possível carregar os dados da matriz.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {branchesQuery.isLoading
            ? 'Carregando filiais…'
            : `${branches.length} filial(is) vinculada(s) ao tenant`}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setActiveOnly((v) => !v)}
          >
            {activeOnly ? 'Mostrar inativas' : 'Mostrar apenas ativas'}
          </Button>
          {canUpdate ? (
            <Dialog
              open={open}
              onOpenChange={(v) => {
                setOpen(v);
                if (!v) {
                  setName('');
                  setAddress('');
                  setPhone('');
                }
              }}
            >
              <DialogTrigger asChild>
                <Button type="button" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nova filial
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Nova filial</DialogTitle>
                  <DialogDescription>
                    A filial será vinculada à matriz ({tenant?.name ?? 'sua empresa'}).
                  </DialogDescription>
                </DialogHeader>
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!name.trim()) {
                      toast.error('Informe o nome da filial');
                      return;
                    }
                    create.mutate();
                  }}
                >
                  <FormField label="Nome da filial" required>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex.: Filial Campinas"
                    />
                  </FormField>
                  <FormField label="Endereço">
                    <Input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Opcional"
                    />
                  </FormField>
                  <FormField label="Telefone">
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Opcional"
                    />
                  </FormField>
                  <Button type="submit" className="w-full" disabled={create.isPending}>
                    {create.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Salvar filial'
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          ) : null}
        </div>
      </div>

      <Card className={cn('overflow-hidden border border-border shadow-card')}>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Filial</TableHead>
              <TableHead>Endereço</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Status</TableHead>
              {canUpdate ? <TableHead className="w-28" /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {branches.map((b) => (
              <TableRow key={b.id} className="bg-white">
                <TableCell className="font-medium">{b.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {b.address ?? '—'}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{b.phone ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant={b.active ? 'secondary' : 'destructive'}>
                    {b.active ? 'Ativa' : 'Inativa'}
                  </Badge>
                </TableCell>
                {canUpdate ? (
                  <TableCell>
                    {b.active ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={deactivate.isPending}
                        onClick={() => deactivate.mutate(b.id)}
                      >
                        Inativar
                      </Button>
                    ) : null}
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
            {!branches.length && !branchesQuery.isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={canUpdate ? 5 : 4}
                  className="py-10 text-center text-muted-foreground"
                >
                  Nenhuma filial cadastrada. A matriz já é o tenant; adicione filiais aqui.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
