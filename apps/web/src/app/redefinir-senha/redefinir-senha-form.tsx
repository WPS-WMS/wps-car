'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Car, Loader2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const inputClass =
  'h-10 rounded-[10px] border-input bg-white px-3 text-sm shadow-sm transition-all duration-200 hover:border-brand-400/60 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40';

export default function RedefinirSenhaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState('');

  useEffect(() => {
    const fromHash = new URLSearchParams(
      window.location.hash.replace(/^#/, ''),
    ).get('token');
    const fromQuery = searchParams.get('token');
    setToken(fromHash ?? fromQuery ?? '');
  }, [searchParams]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!token) {
      setError('Link inválido. Solicite uma nova recuperação de senha.');
      return;
    }

    if (password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await api.resetPasswordWithToken({ token, newPassword: password });
      setMessage(result.message);
      setTimeout(() => router.replace('/login'), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível redefinir a senha');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-page-gradient p-6">
      <Card className="w-full max-w-md border border-border bg-card shadow-card">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md">
            <Car className="h-6 w-6" strokeWidth={2.25} />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold">Nova senha</CardTitle>
            <CardDescription>Crie uma nova senha para acessar o WPS Car.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {!token ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-destructive">
                Link inválido ou incompleto. Solicite uma nova recuperação.
              </p>
              <Link
                href="/esqueci-senha"
                className="inline-flex h-10 w-full items-center justify-center rounded-[10px] bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
              >
                Solicitar novo link
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nova senha</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className={inputClass}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className={inputClass}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>
              {message ? (
                <p className="rounded-[10px] bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-emerald-100">
                  {message}
                </p>
              ) : null}
              {error ? (
                <p className="rounded-[10px] bg-destructive/10 px-3 py-2 text-sm text-destructive ring-1 ring-destructive/20">
                  {error}
                </p>
              ) : null}
              <Button type="submit" className="h-10 w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando…
                  </>
                ) : (
                  'Redefinir senha'
                )}
              </Button>
            </form>
          )}
          <p className="mt-5 text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-medium text-brand-700 hover:underline">
              Voltar ao login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
