'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Car, ShieldCheck, TrendingUp } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { getAccessToken } from '@/lib/auth-storage';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const inputClass =
  'h-10 rounded-[10px] border-input bg-white px-3 text-sm shadow-sm transition-all duration-200 hover:border-brand-400/60 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('admin@revendademo.com.br');
  const [password, setPassword] = useState('Admin@123');
  const [tenantCnpj, setTenantCnpj] = useState('00000000000191');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && getAccessToken()) {
      router.replace('/dashboard');
    }
  }, [isLoading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password, tenantCnpj || undefined);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha no login');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Painel de apresentação — mesmo degradê da sidebar do app */}
      <aside className="relative hidden w-[min(48%,520px)] shrink-0 flex-col justify-between overflow-hidden bg-login-panel-gradient p-10 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(37,99,235,0.35)_0%,transparent_55%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_100%,rgba(52,211,153,0.12)_0%,transparent_50%)]"
          aria-hidden
        />

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 shadow-lg ring-1 ring-white/10">
            <Car className="h-6 w-6 text-white" strokeWidth={2.25} />
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight">WPS Car</p>
            <p className="text-sm text-slate-400">Gestão de revenda</p>
          </div>
        </div>

        <div className="relative max-w-md space-y-6">
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-balance">
            Estoque, vendas e resultados em um só lugar
          </h2>
          <p className="text-base leading-relaxed text-slate-300">
            Controle veículos, negociações, comissões e relatórios com visão clara para
            gerentes e vendedores.
          </p>
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/10">
                <ShieldCheck className="h-4 w-4 text-brand-300" />
              </span>
              Multi-empresa com acesso seguro
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/10">
                <TrendingUp className="h-4 w-4 text-brand-300" />
              </span>
              Dashboard e exportação PDF / Excel
            </li>
          </ul>
        </div>

        <p className="relative text-xs text-slate-500">© WPS Car — gestão automotiva</p>
      </aside>

      {/* Formulário — mesmo fundo das telas internas */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-card px-6 py-4 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 shadow-md">
            <Car className="h-5 w-5 text-white" strokeWidth={2.25} />
          </div>
          <div>
            <p className="font-bold text-foreground">WPS Car</p>
            <p className="text-xs text-muted-foreground">Gestão de revenda</p>
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
          <Card className="w-full max-w-md border border-border bg-card shadow-card">
            <CardHeader className="space-y-4 pb-2 text-center sm:text-left">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md sm:mx-0">
                <Car className="h-6 w-6" strokeWidth={2.25} />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold text-foreground">
                  Entrar na sua conta
                </CardTitle>
                <CardDescription>
                  Informe os dados da revenda para continuar
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <form noValidate onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tenantCnpj">CNPJ da empresa</Label>
                  <Input
                    id="tenantCnpj"
                    className={inputClass}
                    placeholder="Somente números"
                    value={tenantCnpj}
                    onChange={(e) => setTenantCnpj(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    className={inputClass}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className={inputClass}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {error ? (
                  <p
                    className="rounded-[10px] bg-destructive/10 px-3 py-2 text-sm text-destructive ring-1 ring-destructive/20"
                    role="alert"
                  >
                    {error}
                  </p>
                ) : null}
                <Button
                  type="submit"
                  className={cn('h-10 w-full rounded-[10px] text-sm font-semibold shadow-sm')}
                  size="lg"
                  disabled={submitting}
                >
                  {submitting ? 'Entrando…' : 'Acessar plataforma'}
                </Button>
              </form>
              <p className="mt-5 rounded-[10px] bg-accent px-3 py-2.5 text-center text-xs text-accent-foreground">
                Demo: admin@revendademo.com.br · Admin@123
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
