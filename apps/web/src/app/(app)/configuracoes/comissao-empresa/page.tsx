'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { SettingsPageShell } from '@/components/settings/settings-page-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type CommissionRule = {
  id: string;
  name: string;
  type: string;
  value: string;
  active: boolean;
  isDefault: boolean;
};

export default function ComissaoEmpresaConfigPage() {
  const queryClient = useQueryClient();
  const [activeOnly, setActiveOnly] = useState(true);

  const query = useQuery({
    queryKey: ['commission-rules', { activeOnly }],
    queryFn: async () => (await api.getCommissionRules(activeOnly)) as CommissionRule[],
  });

  const deactivate = useMutation({
    mutationFn: async (id: string) => {
      await api.deactivateCommissionRule(id);
    },
    onSuccess: () => {
      toast.success('Regra inativada');
      queryClient.invalidateQueries({ queryKey: ['commission-rules'] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao inativar');
    },
  });

  const items = query.data ?? [];

  return (
    <SettingsPageShell
      title="Comissão padrão da empresa"
      description="Regra aplicada quando o vendedor não possui comissão individual"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {query.isLoading ? 'Carregando…' : `${items.length} regra(s)`}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setActiveOnly((v) => !v)}
          >
            {activeOnly ? 'Mostrar inativas' : 'Mostrar apenas ativas'}
          </Button>
        </div>

        <Card className="overflow-hidden border border-border shadow-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Padrão</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-28" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((r) => (
                <TableRow key={r.id} className="bg-white">
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-sm">{r.type}</TableCell>
                  <TableCell className="text-sm">{r.value}</TableCell>
                  <TableCell>
                    {r.isDefault ? <Badge variant="success">Padrão</Badge> : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.active ? 'secondary' : 'destructive'}>
                      {r.active ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {r.active && !r.isDefault ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={deactivate.isPending}
                        onClick={() => deactivate.mutate(r.id)}
                      >
                        {deactivate.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Inativar'
                        )}
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
              {!items.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    Nenhuma regra encontrada
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </Card>
      </div>
    </SettingsPageShell>
  );
}
