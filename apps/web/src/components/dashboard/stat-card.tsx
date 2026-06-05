import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

const iconStyles = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-emerald-100 text-emerald-600',
  purple: 'bg-violet-100 text-violet-600',
  orange: 'bg-orange-100 text-orange-600',
} as const;

export function StatCard({
  title,
  value,
  hint,
  icon: Icon,
  tone = 'blue',
  trend,
}: {
  title: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  tone?: keyof typeof iconStyles;
  trend?: { value: string; positive?: boolean };
}) {
  return (
    <Card className="border border-border shadow-card transition-shadow hover:shadow-card-hover">
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">{value}</p>
          {trend ? (
            <p
              className={cn(
                'mt-1 text-xs font-medium',
                trend.positive ? 'text-emerald-600' : 'text-muted-foreground',
              )}
            >
              {trend.value}
            </p>
          ) : hint ? (
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        {Icon ? (
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
              iconStyles[tone],
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
