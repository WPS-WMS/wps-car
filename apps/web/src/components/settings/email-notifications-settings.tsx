'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Mail, Pencil, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import type { EmailNotificationTypeConfig } from '@/types/api';
import { useAuth } from '@/providers/auth-provider';
import { hasPermission } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { FormField } from '@/components/vehicles/form-field';
import { TenantSettingsPanel } from '@/components/settings/tenant-settings-panel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type NotificationRole = 'ADMIN' | 'MANAGER' | 'SELLER';
type RecipientMatrix = Record<string, NotificationRole[]>;

const ROLE_ORDER: NotificationRole[] = ['SELLER', 'MANAGER', 'ADMIN'];

const ROLE_META: Record<
  NotificationRole,
  { label: string; short: string; badgeClass: string; cellClass: string }
> = {
  SELLER: {
    label: 'Vendedor',
    short: 'Vend.',
    badgeClass: 'border-sky-200 bg-sky-50 text-sky-800',
    cellClass: 'hover:bg-sky-50/80',
  },
  MANAGER: {
    label: 'Gerente',
    short: 'Ger.',
    badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    cellClass: 'hover:bg-emerald-50/80',
  },
  ADMIN: {
    label: 'Administrador',
    short: 'Admin.',
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-900',
    cellClass: 'hover:bg-amber-50/80',
  },
};

function matrixFromTypes(types: EmailNotificationTypeConfig[]): RecipientMatrix {
  return Object.fromEntries(types.map((type) => [type.code, [...type.recipientRoles]]));
}

function matrixEquals(a: RecipientMatrix, b: RecipientMatrix) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    const left = [...(a[key] ?? [])].sort().join(',');
    const right = [...(b[key] ?? [])].sort().join(',');
    if (left !== right) return false;
  }
  return true;
}

function RoleToggleCell({
  role,
  enabled,
  canUpdate,
  onToggle,
}: {
  role: NotificationRole;
  enabled: boolean;
  canUpdate: boolean;
  onToggle: () => void;
}) {
  const meta = ROLE_META[role];

  const content = enabled ? (
    <span
      className={cn(
        'rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
        meta.badgeClass,
      )}
    >
      {meta.short}
    </span>
  ) : (
    <span className="text-xs text-muted-foreground/70">+ vazio</span>
  );

  if (!canUpdate) {
    return (
      <div className="flex min-h-[44px] items-center justify-center px-2">{content}</div>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'flex min-h-[44px] w-full items-center justify-center rounded-md px-2 transition-colors',
        meta.cellClass,
      )}
    >
      {content}
    </button>
  );
}

function toggleMatrixRole(
  matrix: RecipientMatrix,
  code: string,
  role: NotificationRole,
): RecipientMatrix {
  const current = matrix[code] ?? [];
  const next = current.includes(role)
    ? current.filter((item) => item !== role)
    : [...current, role];
  return { ...matrix, [code]: next };
}

function TemplateEditorDialog({
  open,
  onOpenChange,
  type,
  canUpdate,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: EmailNotificationTypeConfig | null;
  canUpdate: boolean;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState({ active: false, subject: '', bodyHtml: '' });

  useEffect(() => {
    if (!type) return;
    setDraft({
      active: type.active,
      subject: type.subject,
      bodyHtml: type.bodyHtml,
    });
  }, [type, open]);

  const save = useMutation({
    mutationFn: () => {
      if (!type) throw new Error('Tipo inválido');
      return api.updateEmailNotification(type.code, {
        active: draft.active,
        subject: draft.subject.trim(),
        bodyHtml: draft.bodyHtml.trim(),
      });
    },
    onSuccess: () => {
      toast.success('Modelo de e-mail salvo');
      onSaved();
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao salvar modelo');
    },
  });

  if (!type) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{type.label}</DialogTitle>
          <DialogDescription>{type.triggerDescription}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <label className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Ativar envio deste e-mail</p>
              <p className="text-xs text-muted-foreground">
                Quando desativado, este tipo de mensagem não será enviado.
              </p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500"
              checked={draft.active}
              disabled={!canUpdate}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, active: event.target.checked }))
              }
            />
          </label>

          <FormField label="Assunto" required>
            <Input
              value={draft.subject}
              disabled={!canUpdate}
              onChange={(event) => setDraft((prev) => ({ ...prev, subject: event.target.value }))}
            />
          </FormField>

          <FormField label="Corpo da mensagem (HTML)" required>
            <textarea
              rows={8}
              value={draft.bodyHtml}
              disabled={!canUpdate}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, bodyHtml: event.target.value }))
              }
              className={cn(
                'w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm',
              )}
            />
          </FormField>

          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4">
            <p className="text-sm font-medium">Variáveis disponíveis</p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {type.variables.map((variable) => (
                <li key={variable.name} className="text-sm">
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{`{{${variable.name}}}`}</code>
                  <span className="ml-2 text-muted-foreground">{variable.description}</span>
                </li>
              ))}
            </ul>
          </div>

          {canUpdate ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => save.mutate()}
                disabled={
                  save.isPending || !draft.subject.trim() || !draft.bodyHtml.trim()
                }
              >
                {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar modelo'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setDraft({
                    active: draft.active,
                    subject: type.defaults.subject,
                    bodyHtml: type.defaults.bodyHtml,
                  })
                }
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Restaurar texto padrão
              </Button>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function EmailNotificationsSettings() {
  const { user } = useAuth();
  const canUpdate = hasPermission(user, 'settings:update');
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['email-notifications'],
    queryFn: () => api.getEmailNotifications(),
  });

  const [matrixDraft, setMatrixDraft] = useState<RecipientMatrix>({});
  const [editorType, setEditorType] = useState<EmailNotificationTypeConfig | null>(null);

  const savedMatrix = useMemo(
    () => (query.data ? matrixFromTypes(query.data.types) : {}),
    [query.data],
  );

  useEffect(() => {
    if (query.data) {
      setMatrixDraft(matrixFromTypes(query.data.types));
    }
  }, [query.data]);

  const isDirty = useMemo(
    () => !matrixEquals(matrixDraft, savedMatrix),
    [matrixDraft, savedMatrix],
  );

  const saveMatrix = useMutation({
    mutationFn: () =>
      api.updateEmailNotificationRecipients({
        rules: Object.entries(matrixDraft).map(([code, roles]) => ({ code, roles })),
      }),
    onSuccess: async () => {
      toast.success('Regras de envio salvas');
      await queryClient.invalidateQueries({ queryKey: ['email-notifications'] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao salvar regras');
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['email-notifications'] });
  };

  const roleTypes = useMemo(
    () => query.data?.types.filter((type) => type.supportsRoleRecipients) ?? [],
    [query.data?.types],
  );

  const fixedTypes = useMemo(
    () => query.data?.types.filter((type) => !type.supportsRoleRecipients) ?? [],
    [query.data?.types],
  );

  if (query.isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando configurações…</p>;
  }

  if (query.isError || !query.data) {
    return (
      <p className="text-sm text-destructive">Não foi possível carregar os tipos de e-mail.</p>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border border-border shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4" />
            Remetente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            E-mail usado como remetente das mensagens automáticas da revenda.
          </p>
          <TenantSettingsPanel keys={['notification_email']} embedded />
        </CardContent>
      </Card>

      <Card className="border border-border shadow-card">
        <CardHeader className="space-y-4 border-b border-border/60 pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">Regras de envio</CardTitle>
              <p className="text-sm text-muted-foreground">
                Clique em uma célula para escolher quem recebe cada e-mail. Célula vazia = não
                envia.
              </p>
            </div>
            {canUpdate ? (
              <Button
                type="button"
                onClick={() => saveMatrix.mutate()}
                disabled={saveMatrix.isPending || !isDirty}
              >
                {saveMatrix.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando…
                  </>
                ) : (
                  'Salvar alterações'
                )}
              </Button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="font-medium text-muted-foreground">Legenda:</span>
            {ROLE_ORDER.map((role) => (
              <span
                key={role}
                className={cn(
                  'rounded-full border px-2.5 py-0.5 font-semibold',
                  ROLE_META[role].badgeClass,
                )}
              >
                {ROLE_META[role].short}
              </span>
            ))}
            <span className="text-muted-foreground">{ROLE_META.SELLER.label}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{ROLE_META.MANAGER.label}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{ROLE_META.ADMIN.label}</span>
          </div>
        </CardHeader>

        <CardContent className="overflow-x-auto p-0 pt-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-[220px] bg-muted/30 pl-6">Gatilho</TableHead>
                {ROLE_ORDER.map((role) => (
                  <TableHead
                    key={role}
                    className="min-w-[110px] bg-muted/30 text-center text-xs uppercase tracking-wide"
                  >
                    {ROLE_META[role].label}
                  </TableHead>
                ))}
                <TableHead className="min-w-[100px] bg-muted/30 text-center">Modelo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roleTypes.map((type) => (
                <TableRow key={type.code}>
                  <TableCell className="pl-6 align-middle">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">{type.label}</p>
                      <p className="text-xs text-muted-foreground">{type.triggerDescription}</p>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <Badge variant={type.active ? 'secondary' : 'outline'}>
                          {type.active ? 'Envio ativo' : 'Envio inativo'}
                        </Badge>
                        {type.recipientLabel ? (
                          <span className="text-xs text-muted-foreground">
                            + {type.recipientLabel.toLowerCase()}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>
                  {ROLE_ORDER.map((role) => (
                    <TableCell key={role} className="align-middle p-1">
                      <RoleToggleCell
                        role={role}
                        enabled={(matrixDraft[type.code] ?? []).includes(role)}
                        canUpdate={canUpdate}
                        onToggle={() =>
                          setMatrixDraft((prev) => toggleMatrixRole(prev, type.code, role))
                        }
                      />
                    </TableCell>
                  ))}
                  <TableCell className="align-middle text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditorType(type)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {fixedTypes.map((type) => (
                <TableRow key={type.code}>
                  <TableCell className="pl-6 align-middle">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">{type.label}</p>
                      <p className="text-xs text-muted-foreground">{type.triggerDescription}</p>
                      <Badge variant={type.active ? 'secondary' : 'outline'} className="mt-1">
                        {type.active ? 'Envio ativo' : 'Envio inativo'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell colSpan={ROLE_ORDER.length} className="align-middle text-center">
                    <span className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
                      Destinatário fixo: {type.recipientLabel}
                    </span>
                  </TableCell>
                  <TableCell className="align-middle text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditorType(type)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <p className="border-t border-border/60 px-6 py-3 text-xs text-muted-foreground">
            Clique numa célula para ativar ou desativar o envio para aquele perfil. Célula vazia =
            não envia.
          </p>
        </CardContent>
      </Card>

      <TemplateEditorDialog
        open={Boolean(editorType)}
        onOpenChange={(open) => {
          if (!open) setEditorType(null);
        }}
        type={editorType}
        canUpdate={canUpdate}
        onSaved={invalidate}
      />
    </div>
  );
}
