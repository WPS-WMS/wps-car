'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

export default function SegurancaPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [setupSecret, setSetupSecret] = useState<string | null>(null);
  const [enableCode, setEnableCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');

  const status = useQuery({
    queryKey: ['auth', '2fa', 'status'],
    queryFn: () => api.getTwoFactorStatus(),
    enabled: user?.role === 'ADMIN' || user?.role === 'MODERATOR',
  });

  const setup = useMutation({
    mutationFn: () => api.setupTwoFactor(),
    onSuccess: (data) => {
      setSetupSecret(data.secret);
      toast.success('Secret gerado. Confirme com um código do autenticador.');
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Falha ao configurar 2FA');
    },
  });

  const enable = useMutation({
    mutationFn: () => api.enableTwoFactor(enableCode.replace(/\s/g, '')),
    onSuccess: () => {
      setSetupSecret(null);
      setEnableCode('');
      queryClient.invalidateQueries({ queryKey: ['auth', '2fa', 'status'] });
      toast.success('Autenticação em duas etapas ativada');
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Código inválido');
    },
  });

  const disable = useMutation({
    mutationFn: () =>
      api.disableTwoFactor({
        code: disableCode.replace(/\s/g, ''),
        password: disablePassword,
      }),
    onSuccess: () => {
      setDisableCode('');
      setDisablePassword('');
      queryClient.invalidateQueries({ queryKey: ['auth', '2fa', 'status'] });
      toast.success('Autenticação em duas etapas desativada');
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Falha ao desativar 2FA');
    },
  });

  if (user?.role !== 'ADMIN' && user?.role !== 'MODERATOR') {
    return (
      <p className="text-sm text-muted-foreground">
        Autenticação em duas etapas está disponível apenas para administradores e moderadores.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Segurança da conta"
        description="Proteja o acesso com autenticação em duas etapas (TOTP)"
      />

      <Card className="border border-border shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5 text-brand-600" />
            Autenticação em duas etapas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status.isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : status.data?.enabled ? (
            <div className="space-y-4">
              <p className="text-sm text-green-700">2FA ativo nesta conta.</p>
              <div className="grid gap-3 sm:max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="disableCode">Código do autenticador</Label>
                  <Input
                    id="disableCode"
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value)}
                    placeholder="000000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="disablePassword">Senha atual</Label>
                  <Input
                    id="disablePassword"
                    type="password"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={disable.isPending}
                  onClick={() => disable.mutate()}
                >
                  Desativar 2FA
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Use Google Authenticator, Authy ou similar. Recomendado para contas de
                administrador e moderador da plataforma.
              </p>

              {!setupSecret ? (
                <Button type="button" disabled={setup.isPending} onClick={() => setup.mutate()}>
                  Gerar chave 2FA
                </Button>
              ) : (
                <div className="space-y-4 rounded-lg border border-border bg-muted/40 p-4">
                  <p className="text-sm font-medium text-foreground">Chave manual (base32)</p>
                  <code className="block break-all rounded bg-background px-3 py-2 text-xs">
                    {setupSecret}
                  </code>
                  <p className="text-xs text-muted-foreground">
                    Adicione esta chave no app autenticador e informe o código de 6 dígitos abaixo.
                  </p>
                  <div className="space-y-2 sm:max-w-xs">
                    <Label htmlFor="enableCode">Código de confirmação</Label>
                    <Input
                      id="enableCode"
                      value={enableCode}
                      onChange={(e) => setEnableCode(e.target.value)}
                      placeholder="000000"
                    />
                  </div>
                  <Button
                    type="button"
                    disabled={enable.isPending}
                    onClick={() => enable.mutate()}
                  >
                    Ativar 2FA
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
