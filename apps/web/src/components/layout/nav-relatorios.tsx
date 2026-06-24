'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { hasPermission } from '@/lib/permissions';
import { RELATORIOS_NAV_ITEMS, RELATORIOS_NAV_META } from '@/lib/sidebar-nav';

export function NavRelatorios({
  navLinkClass,
}: {
  navLinkClass: (active: boolean) => string;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const visible = RELATORIOS_NAV_ITEMS.filter((item) =>
    hasPermission(user, item.permission),
  );
  const isActive = pathname.startsWith('/relatorios');
  const [open, setOpen] = useState(isActive);
  const MetaIcon = RELATORIOS_NAV_META.icon;

  if (!visible.length) return null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={navLinkClass(isActive)}
      >
        <MetaIcon className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">{RELATORIOS_NAV_META.label}</span>
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
