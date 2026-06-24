'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Car, Loader2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const inputClass =
  'h-10 rounded-[10px] border-input bg-white px-3 text-sm shadow-sm transition-all duration-200 hover:border-brand-400/60 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40';

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);

    try {
      const result = await api.forgotPassword(email.trim());
      setMessage(result.message);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível enviar o pedido');
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
            <CardTitle className="text-xl font-bold">Recuperar senha</CardTitle>
            <CardDescription>
              Informe seu e-mail. Se existir uma conta, enviaremos um link de redefinição.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                className={inputClass}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
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
                  Enviando…
                </>
              ) : (
                'Enviar link de recuperação'
              )}
            </Button>
          </form>
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
