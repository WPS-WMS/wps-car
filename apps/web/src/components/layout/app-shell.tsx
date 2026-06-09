'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  LogOut,
  Car,
  CarFront,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { hasPermission } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { NavCadastro } from './nav-cadastro';
import { NavRelatorios } from './nav-relatorios';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/veiculos', label: 'Veículos e produtos', icon: CarFront },
  { href: '/estoque', label: 'Estoque', icon: Package },
  { href: '/vendas', label: 'Vendas', icon: ShoppingCart },
];

function userInitial(name?: string) {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function AppShell({ children }: { children: React.ReactNode }) {
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
              <Car className="h-5 w-5 text-white" strokeWidth={2.25} />
            </div>
            <div>
              <p className="text-base font-bold tracking-tight text-white">WPS Car</p>
              <p className="text-xs text-slate-400">Gestão de revenda</p>
            </div>
          </div>
        </div>

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={navLinkClass(active)}>
                <Icon className={cn('h-4 w-4 shrink-0', active && 'text-white')} />
                {item.label}
              </Link>
            );
          })}
          <NavCadastro navLinkClass={navLinkClass} />
          <NavRelatorios navLinkClass={navLinkClass} />
          {hasPermission(user, 'settings:read') ? (
            <Link
              href="/configuracoes"
              className={navLinkClass(pathname.startsWith('/configuracoes'))}
            >
              <Settings className="h-4 w-4 shrink-0" />
              Configurações
            </Link>
          ) : null}
        </nav>

        <div className="shrink-0 border-t border-white/10 p-4">
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
