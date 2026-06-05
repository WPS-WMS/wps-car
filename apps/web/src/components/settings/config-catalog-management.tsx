'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import type { ConfigCatalogItem, ConfigCatalogResource } from '@/types/api';
import { useAuth } from '@/providers/auth-provider';
import { hasPermission } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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

const catalogMeta: Record<
  ConfigCatalogResource,
  { queryKey: string; codeHint: string }
> = {
  'vehicle-types': {
    queryKey: 'config-vehicle-types',
    codeHint: 'Ex.: suv, hatch',
  },
  'cost-types': {
    queryKey: 'config-cost-types',
    codeHint: 'Ex.: preparacao, documentacao',
  },
  'payment-methods': {
    queryKey: 'config-payment-methods',
    codeHint: 'Ex.: pix, financiamento',
  },
};

function slugCode(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

export function ConfigCatalogManagement({
  resource,
}: {
  resource: ConfigCatalogResource;
}) {
  const { user } = useAuth();
  const canUpdate = hasPermission(user, 'settings:update');
  const meta = catalogMeta[resource];
  const queryClient = useQueryClient();
  const [activeOnly, setActiveOnly] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [codeTouched, setCodeTouched] = useState(false);

  const query = useQuery({
    queryKey: [meta.queryKey, { activeOnly }],
    queryFn: () => api.getConfigCatalog(resource, activeOnly),
  });

  const create = useMutation({
    mutationFn: async () => {
      await api.createConfigCatalogItem(resource, {
        name: name.trim(),
        code: code.trim().toLowerCase(),
        sortOrder: Number(sortOrder) || 0,
      });
    },
    onSuccess: () => {
      toast.success('Item cadastrado');
      queryClient.invalidateQueries({ queryKey: [meta.queryKey] });
      setOpen(false);
      setName('');
      setCode('');
      setSortOrder('0');
      setCodeTouched(false);
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao cadastrar');
    },
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => api.deactivateConfigCatalogItem(resource, id),
    onSuccess: () => {
      toast.success('Item inativado');
      queryClient.invalidateQueries({ queryKey: [meta.queryKey] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao inativar');
    },
  });

  const items = query.data ?? [];

  function handleNameChange(value: string) {
    setName(value);
    if (!codeTouched) setCode(slugCode(value));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {query.isLoading ? 'Carregando…' : `${items.length} registro(s)`}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setActiveOnly((v) => !v)}
          >
            {activeOnly ? 'Mostrar inativos' : 'Mostrar apenas ativos'}
          </Button>
          {canUpdate ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button type="button" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Novo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Novo item</DialogTitle>
                  <DialogDescription>
                    O código é usado internamente e deve conter apenas letras minúsculas,
                    números e underscore.
                  </DialogDescription>
                </DialogHeader>
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    create.mutate();
                  }}
                >
                  <FormField label="Nome" required>
                    <Input
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Nome exibido"
                    />
                  </FormField>
                  <FormField label="Código" required>
                    <Input
                      value={code}
                      onChange={(e) => {
                        setCodeTouched(true);
                        setCode(e.target.value);
                      }}
                      placeholder={meta.codeHint}
                    />
                  </FormField>
                  <FormField label="Ordem">
                    <Input
                      type="number"
                      min={0}
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                    />
                  </FormField>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!name.trim() || !code.trim() || create.isPending}
                  >
                    {create.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Salvar'
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          ) : null}
        </div>
      </div>

      <Card className="overflow-hidden border border-border shadow-card">
        <CatalogTable
          items={items}
          canUpdate={canUpdate}
          onDeactivate={(id) => deactivate.mutate(id)}
          deactivatePending={deactivate.isPending}
        />
      </Card>
    </div>
  );
}

function CatalogTable({
  items,
  canUpdate,
  onDeactivate,
  deactivatePending,
}: {
  items: ConfigCatalogItem[];
  canUpdate: boolean;
  onDeactivate: (id: string) => void;
  deactivatePending: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50 hover:bg-muted/50">
          <TableHead>Nome</TableHead>
          <TableHead>Código</TableHead>
          <TableHead>Ordem</TableHead>
          <TableHead>Status</TableHead>
          {canUpdate ? <TableHead className="w-28" /> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id} className="bg-white">
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell className="font-mono text-sm text-muted-foreground">
              {item.code}
            </TableCell>
            <TableCell className="text-sm">{item.sortOrder}</TableCell>
            <TableCell>
              <Badge variant={item.active ? 'secondary' : 'destructive'}>
                {item.active ? 'Ativo' : 'Inativo'}
              </Badge>
            </TableCell>
            {canUpdate ? (
              <TableCell>
                {item.active ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={deactivatePending}
                    onClick={() => onDeactivate(item.id)}
                  >
                    Inativar
                  </Button>
                ) : null}
              </TableCell>
            ) : null}
          </TableRow>
        ))}
        {!items.length ? (
          <TableRow>
            <TableCell
              colSpan={canUpdate ? 5 : 4}
              className="py-10 text-center text-muted-foreground"
            >
              Nenhum registro encontrado
            </TableCell>
          </TableRow>
        ) : null}
      </TableBody>
    </Table>
  );
}
