import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function ConfigCard({
  href,
  title,
  description,
  icon: Icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <Link href={href} className="block h-full">
      <Card className="h-full border border-border shadow-card transition-shadow hover:shadow-card-hover">
        <CardContent className="flex h-full min-h-[7.5rem] items-start gap-4 p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className={cn('mt-1 line-clamp-2 text-sm text-muted-foreground')}>
              {description}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
