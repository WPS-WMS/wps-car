'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { hasPermission } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FormField } from '@/components/vehicles/form-field';
import { TenantSettingsPanel } from '@/components/settings/tenant-settings-panel';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function EmailNotificationsSettings() {
  const { user } = useAuth();
  const canUpdate = hasPermission(user, 'settings:update');
  const queryClient = useQueryClient();
  const [activeOnly, setActiveOnly] = useState(true);
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');

  const query = useQuery({
    queryKey: ['config-email-templates', { activeOnly }],
    queryFn: () => api.getConfigEmailTemplates(activeOnly),
  });

  const create = useMutation({
    mutationFn: async () => {
      await api.createConfigEmailTemplate({
        code: code.trim().toLowerCase(),
        subject: subject.trim(),
        bodyHtml: bodyHtml.trim(),
      });
    },
    onSuccess: () => {
      toast.success('Template cadastrado');
      queryClient.invalidateQueries({ queryKey: ['config-email-templates'] });
      setOpen(false);
      setCode('');
      setSubject('');
      setBodyHtml('');
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao cadastrar');
    },
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => api.deactivateConfigEmailTemplate(id),
    onSuccess: () => {
      toast.success('Template inativado');
      queryClient.invalidateQueries({ queryKey: ['config-email-templates'] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao inativar');
    },
  });

  const items = query.data ?? [];

  return (
    <div className="space-y-6">
      <Card className="border border-border shadow-card">
        <CardHeader>
          <CardTitle className="text-base">E-mail de envio</CardTitle>
        </CardHeader>
        <CardContent>
          <TenantSettingsPanel keys={['notification_email']} embedded />
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Templates de e-mail</h2>
            <p className="text-sm text-muted-foreground">
              {query.isLoading ? 'Carregando…' : `${items.length} template(s)`}
            </p>
          </div>
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
                    Novo template
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Novo template</DialogTitle>
                    <DialogDescription>
                      Use variáveis como {'{{customerName}}'} no corpo HTML.
                    </DialogDescription>
                  </DialogHeader>
                  <form
                    className="space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      create.mutate();
                    }}
                  >
                    <FormField label="Código" required>
                      <Input
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="sale_completed"
                      />
                    </FormField>
                    <FormField label="Assunto" required>
                      <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
                    </FormField>
                    <FormField label="Corpo (HTML)" required>
                      <textarea
                        rows={6}
                        value={bodyHtml}
                        onChange={(e) => setBodyHtml(e.target.value)}
                        className={cn(
                          'w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm',
                        )}
                      />
                    </FormField>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={
                        !code.trim() || !subject.trim() || !bodyHtml.trim() || create.isPending
                      }
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
                <TableHead>Código</TableHead>
                <TableHead>Assunto</TableHead>
                <TableHead>Status</TableHead>
                {canUpdate ? <TableHead className="w-28" /> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((t) => (
                <TableRow key={t.id} className="bg-white">
                  <TableCell className="font-mono text-sm">{t.code}</TableCell>
                  <TableCell className="font-medium">{t.subject}</TableCell>
                  <TableCell>
                    <Badge variant={t.active ? 'secondary' : 'destructive'}>
                      {t.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  {canUpdate ? (
                    <TableCell>
                      {t.active ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={deactivate.isPending}
                          onClick={() => deactivate.mutate(t.id)}
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
                    colSpan={canUpdate ? 4 : 3}
                    className="py-10 text-center text-muted-foreground"
                  >
                    Nenhum template encontrado
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
