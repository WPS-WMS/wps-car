import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BackLink({
  href,
  label = 'Voltar',
  className,
}: {
  href: string;
  label?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground',
        className,
      )}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-white shadow-sm transition-all group-hover:border-brand-300 group-hover:text-brand-600">
        <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
      </span>
      {label}
    </Link>
  );
}
