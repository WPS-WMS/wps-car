'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ClipboardList, Users, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { hasPermission } from '@/lib/permissions';

const items = [
  {
    href: '/clientes',
    label: 'Clientes',
    icon: Users,
    permission: 'customers:read',
  },
  {
    href: '/fornecedores',
    label: 'Fornecedores',
    icon: Truck,
    permission: 'suppliers:read',
  },
] as const;

export function NavCadastro({
  navLinkClass,
}: {
  navLinkClass: (active: boolean) => string;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const visible = items.filter((item) => hasPermission(user, item.permission));
  const isActive = visible.some((item) => pathname.startsWith(item.href));
  const [open, setOpen] = useState(isActive);

  if (!visible.length) return null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={navLinkClass(isActive)}
      >
        <ClipboardList className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">Cadastro</span>
        <ChevronDown
          className={cn('h-4 w-4 transition-transform', open && 'rotate-180')}
        />
      </button>
      {open ? (
        <ul className="mt-1 space-y-0.5 border-l border-white/10 pl-3 ml-5">
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
