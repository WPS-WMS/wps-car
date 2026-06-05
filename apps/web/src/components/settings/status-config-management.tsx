'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import type { ConfigStatusItem } from '@/types/api';
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

function slugCode(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

export function StatusConfigManagement({ entity }: { entity: 'vehicle' | 'sale' }) {
  const { user } = useAuth();
  const canUpdate = hasPermission(user, 'settings:update');
  const queryClient = useQueryClient();
  const [activeOnly, setActiveOnly] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [color, setColor] = useState('#64748b');
  const [sortOrder, setSortOrder] = useState('0');
  const [codeTouched, setCodeTouched] = useState(false);

  const queryKey = ['config-statuses', entity] as const;

  const query = useQuery({
    queryKey: [...queryKey, { activeOnly }],
    queryFn: () => api.getConfigStatuses(entity, activeOnly),
  });

  const create = useMutation({
    mutationFn: async () => {
      await api.createConfigStatus({
        entity,
        name: name.trim(),
        code: code.trim().toLowerCase(),
        color: color || undefined,
        sortOrder: Number(sortOrder) || 0,
      });
    },
    onSuccess: () => {
      toast.success('Status cadastrado');
      queryClient.invalidateQueries({ queryKey });
      setOpen(false);
      setName('');
      setCode('');
      setColor('#64748b');
      setSortOrder('0');
      setCodeTouched(false);
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao cadastrar');
    },
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => api.deactivateConfigStatus(id),
    onSuccess: () => {
      toast.success('Status inativado');
      queryClient.invalidateQueries({ queryKey });
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
          {query.isLoading ? 'Carregando…' : `${items.length} status`}
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
                  Novo status
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Novo status</DialogTitle>
                  <DialogDescription>
                    Status personalizados complementam os status padrão do sistema.
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
                    />
                  </FormField>
                  <FormField label="Código" required>
                    <Input
                      value={code}
                      onChange={(e) => {
                        setCodeTouched(true);
                        setCode(e.target.value);
                      }}
                    />
                  </FormField>
                  <FormField label="Cor">
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        className="h-10 w-14 cursor-pointer p-1"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                      />
                      <Input value={color} onChange={(e) => setColor(e.target.value)} />
                    </div>
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
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Nome</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Cor</TableHead>
              <TableHead>Ordem</TableHead>
              <TableHead>Status</TableHead>
              {canUpdate ? <TableHead className="w-28" /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <StatusRow
                key={item.id}
                item={item}
                canUpdate={canUpdate}
                onDeactivate={() => deactivate.mutate(item.id)}
                deactivatePending={deactivate.isPending}
              />
            ))}
            {!items.length ? (
              <TableRow>
                <TableCell
                  colSpan={canUpdate ? 6 : 5}
                  className="py-10 text-center text-muted-foreground"
                >
                  Nenhum status encontrado
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function StatusRow({
  item,
  canUpdate,
  onDeactivate,
  deactivatePending,
}: {
  item: ConfigStatusItem;
  canUpdate: boolean;
  onDeactivate: () => void;
  deactivatePending: boolean;
}) {
  return (
    <TableRow className="bg-white">
      <TableCell className="font-medium">{item.name}</TableCell>
      <TableCell className="font-mono text-sm text-muted-foreground">{item.code}</TableCell>
      <TableCell>
        {item.color ? (
          <span className="inline-flex items-center gap-2 text-sm">
            <span
              className="h-4 w-4 rounded-full border border-border"
              style={{ backgroundColor: item.color }}
            />
            {item.color}
          </span>
        ) : (
          '—'
        )}
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
              onClick={onDeactivate}
            >
              Inativar
            </Button>
          ) : null}
        </TableCell>
      ) : null}
    </TableRow>
  );
}
