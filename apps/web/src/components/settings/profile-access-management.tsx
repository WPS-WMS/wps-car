'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, RotateCcw, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import type { ProfileAccessRoleConfig } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const ROLE_TAB_ORDER = ['MANAGER', 'SELLER'] as const;

export function ProfileAccessManagement() {
  const queryClient = useQueryClient();
  const [activeRole, setActiveRole] = useState<(typeof ROLE_TAB_ORDER)[number]>('MANAGER');
  const [draft, setDraft] = useState<Record<string, boolean>>({});

  const query = useQuery({
    queryKey: ['settings', 'profile-access'],
    queryFn: () => api.getProfileAccess(),
  });

  const activeConfig = useMemo(
    () => query.data?.roles.find((role) => role.role === activeRole),
    [activeRole, query.data?.roles],
  );

  const currentDraft = useMemo(() => {
    if (!activeConfig) return {};
    if (Object.keys(draft).length) return draft;
    return Object.fromEntries(
      activeConfig.features.map((feature) => [feature.id, feature.enabled]),
    );
  }, [activeConfig, draft]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const enabledFeatures = Object.entries(currentDraft)
        .filter(([, enabled]) => enabled)
        .map(([id]) => id);
      return api.updateProfileAccess({
        role: activeRole,
        enabledFeatures,
      });
    },
    onSuccess: async () => {
      toast.success('Gestão de perfil atualizada');
      setDraft({});
      await queryClient.invalidateQueries({ queryKey: ['settings', 'profile-access'] });
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : 'Não foi possível salvar as alterações';
      toast.error(message);
    },
  });

  const handleRoleChange = (role: (typeof ROLE_TAB_ORDER)[number]) => {
    setActiveRole(role);
    setDraft({});
  };

  const handleToggle = (featureId: string, enabled: boolean) => {
    setDraft((prev) => ({
      ...(Object.keys(prev).length
        ? prev
        : Object.fromEntries(
            activeConfig?.features.map((feature) => [feature.id, feature.enabled]) ?? [],
          )),
      [featureId]: enabled,
    }));
  };

  const handleRestoreDefaults = () => {
    if (!activeConfig || !query.data) return;
    const defaults = query.data.defaults[activeRole];
    const defaultMap = Object.fromEntries(
      activeConfig.features.map((feature) => [
        feature.id,
        defaults.includes(feature.permission),
      ]),
    );
    setDraft(defaultMap);
  };

  if (query.isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando perfis…</p>;
  }

  if (query.isError || !query.data || !activeConfig) {
    return (
      <p className="text-sm text-destructive">Não foi possível carregar a gestão de perfil.</p>
    );
  }

  const groupedFeatures = query.data.groups
    .map((group) => ({
      ...group,
      features: activeConfig.features.filter((feature) => feature.group === group.id),
    }))
    .filter((group) => group.features.length > 0);

  return (
    <div className="space-y-6">
      <Card className="border border-brand-100 bg-brand-50/40 shadow-card">
        <CardContent className="flex items-start gap-3 p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" />
          <div className="text-sm text-brand-900">
            <p className="font-medium">Administrador sempre tem acesso total</p>
            <p className="mt-1 text-brand-800/80">
              As opções abaixo controlam quais itens do menu lateral aparecem para
              Gerente e Vendedor. Alterações valem após o usuário atualizar a sessão.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {query.data.roles
          .filter((role) => ROLE_TAB_ORDER.includes(role.role as (typeof ROLE_TAB_ORDER)[number]))
          .sort(
            (a, b) =>
              ROLE_TAB_ORDER.indexOf(a.role as (typeof ROLE_TAB_ORDER)[number]) -
              ROLE_TAB_ORDER.indexOf(b.role as (typeof ROLE_TAB_ORDER)[number]),
          )
          .map((role: ProfileAccessRoleConfig) => (
            <Button
              key={role.role}
              type="button"
              variant={activeRole === role.role ? 'default' : 'outline'}
              onClick={() => handleRoleChange(role.role as (typeof ROLE_TAB_ORDER)[number])}
            >
              {role.label}
            </Button>
          ))}
      </div>

      <div className="space-y-4">
        {groupedFeatures.map((group) => (
          <Card key={group.id} className="border border-border shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{group.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {group.features.map((feature) => {
                const enabled = currentDraft[feature.id] ?? feature.enabled;
                return (
                  <label
                    key={feature.id}
                    className={cn(
                      'flex cursor-pointer items-start justify-between gap-4 rounded-lg border px-4 py-3 transition-colors',
                      enabled
                        ? 'border-brand-200 bg-brand-50/50'
                        : 'border-border bg-background',
                    )}
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{feature.label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-border text-brand-600 focus:ring-brand-500"
                      checked={enabled}
                      onChange={(event) => handleToggle(feature.id, event.target.checked)}
                    />
                  </label>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando…
            </>
          ) : (
            `Salvar perfil de ${activeConfig.label.toLowerCase()}`
          )}
        </Button>
        <Button type="button" variant="outline" onClick={handleRestoreDefaults}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Restaurar padrão
        </Button>
      </div>
    </div>
  );
}
