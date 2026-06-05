'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { tenantSettingLabels } from '@/lib/settings-labels';
import { useAuth } from '@/providers/auth-provider';
import { hasPermission } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/vehicles/form-field';

export function TenantSettingsPanel({
  keys,
  embedded = false,
}: {
  keys: string[];
  embedded?: boolean;
}) {
  const { user } = useAuth();
  const canUpdate = hasPermission(user, 'settings:update');
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});

  const query = useQuery({
    queryKey: ['tenant-settings'],
    queryFn: () => api.getTenantSettings(),
  });

  useEffect(() => {
    if (!query.data?.settings) return;
    const next: Record<string, string> = {};
    for (const key of keys) {
      const raw = query.data.settings[key];
      next[key] = raw === undefined || raw === null ? '' : String(raw);
    }
    setValues(next);
  }, [query.data, keys]);

  const save = useMutation({
    mutationFn: async () => {
      const settings: Record<string, unknown> = {};
      for (const key of keys) {
        const meta = tenantSettingLabels[key];
        const raw = values[key] ?? '';
        if (meta?.type === 'number') {
          settings[key] = raw === '' ? 0 : Number(raw);
        } else {
          settings[key] = raw;
        }
      }
      await api.updateTenantSettings(settings);
    },
    onSuccess: () => {
      toast.success('Configurações salvas');
      queryClient.invalidateQueries({ queryKey: ['tenant-settings'] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao salvar');
    },
  });

  const body = query.isLoading ? (
    <div className="py-8 text-center text-sm text-muted-foreground">
      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
    </div>
  ) : (
    <div className="space-y-4">
        {keys.map((key) => {
          const meta = tenantSettingLabels[key];
          if (!meta) return null;
          return (
            <FormField key={key} label={meta.label}>
              {meta.hint ? (
                <p className="-mt-1 mb-2 text-xs text-muted-foreground">{meta.hint}</p>
              ) : null}
              <Input
                type={meta.type === 'number' ? 'number' : meta.type === 'email' ? 'email' : 'text'}
                step={meta.type === 'number' ? '0.01' : undefined}
                value={values[key] ?? ''}
                disabled={!canUpdate}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [key]: e.target.value }))
                }
              />
            </FormField>
          );
        })}
        {canUpdate ? (
          <Button
            type="button"
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="gap-2"
          >
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Salvar
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Você não tem permissão para editar estas configurações.
          </p>
        )}
    </div>
  );

  if (embedded) return body;

  return (
    <Card className="border border-border shadow-card">
      <CardContent className="p-6">{body}</CardContent>
    </Card>
  );
}
