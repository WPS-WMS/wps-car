'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';

export function ModeratorGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user) return;
    if (user.role !== 'MODERATOR') {
      router.replace('/dashboard');
    }
  }, [isLoading, router, user]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-page-gradient text-brand-700">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        <p className="text-sm font-medium">Carregando…</p>
      </div>
    );
  }

  if (user.role !== 'MODERATOR') return null;

  return <>{children}</>;
}
