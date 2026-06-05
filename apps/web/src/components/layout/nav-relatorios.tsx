'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, ChevronDown, LayoutDashboard, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { hasPermission } from '@/lib/permissions';

const items = [
  {
    href: '/relatorios/geral',
    label: 'Relatório geral',
    icon: LayoutDashboard,
    permission: 'reports:read',
  },
  {
    href: '/relatorios/comissoes',
    label: 'Relatório de comissão',
    icon: Percent,
    permission: 'commissions:read',
  },
] as const;

export function NavRelatorios({
  navLinkClass,
}: {
  navLinkClass: (active: boolean) => string;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const visible = items.filter((item) => hasPermission(user, item.permission));
  const isActive = pathname.startsWith('/relatorios');
  const [open, setOpen] = useState(isActive);

  if (!visible.length) return null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={navLinkClass(isActive)}
      >
        <BarChart3 className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">Relatórios</span>
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
      </button>
      {open ? (
        <ul className="mt-1 ml-5 space-y-0.5 border-l border-white/10 pl-3">
          {visible.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all',
                    active
                      ? 'bg-brand-600 font-medium text-white'
                      : 'text-slate-400 hover:bg-sidebar-accent hover:text-white',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

