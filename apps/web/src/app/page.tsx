'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { getAccessToken, getStoredUser } from '@/lib/auth-storage';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace('/login');
      return;
    }
    const role = getStoredUser()?.role;
    router.replace(role === 'MODERATOR' ? '/plataforma' : '/dashboard');
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-page-gradient text-brand-700">
      <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      <p className="text-sm font-medium">Redirecionando…</p>
    </div>
  );
}
