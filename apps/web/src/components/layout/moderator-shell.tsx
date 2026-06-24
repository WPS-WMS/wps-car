'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Car, LogOut, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';

function userInitial(name?: string) {
  if (!name) return 'M';
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function ModeratorShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navLinkClass = (active: boolean) =>
    cn(
      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
      active
        ? 'bg-brand-600 text-white shadow-md ring-1 ring-brand-500/50'
        : 'text-slate-300 hover:bg-sidebar-accent hover:text-white',
    );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="flex h-full w-[260px] shrink-0 flex-col bg-sidebar-gradient text-sidebar-foreground shadow-xl">
        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 shadow-lg">
              <Shield className="h-5 w-5 text-white" strokeWidth={2.25} />
            </div>
            <div>
              <p className="text-base font-bold tracking-tight text-white">WPS Car</p>
              <p className="text-xs text-slate-400">Plataforma SaaS</p>
            </div>
          </div>
        </div>

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <Link
            href="/plataforma"
            className={navLinkClass(pathname.startsWith('/plataforma'))}
          >
            <BarChart3
              className={cn(
                'h-4 w-4 shrink-0',
                pathname.startsWith('/plataforma') && 'text-white',
              )}
            />
            Métricas e cobrança
          </Link>
        </nav>

        <div className="shrink-0 border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-sidebar-accent/60 px-3 py-2">
            <Car className="h-4 w-4 text-slate-400" />
            <p className="text-xs text-slate-400">Acesso exclusivo do moderador</p>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/80 px-3 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
              {userInitial(user?.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
              <p className="truncate text-xs text-slate-400">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-start gap-2 text-slate-400 hover:bg-sidebar-accent hover:text-white"
            onClick={() => logout()}
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>

      <main className="min-h-0 flex-1 overflow-y-auto bg-background">
        <div className="mx-auto max-w-7xl p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
