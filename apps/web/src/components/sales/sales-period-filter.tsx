'use client';

import { CalendarRange } from 'lucide-react';
import type { PeriodFilterValue, PeriodPreset } from '@/lib/date-period';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const presets: { id: PeriodPreset; label: string }[] = [
  { id: 'day', label: 'Dia' },
  { id: 'month', label: 'Mês' },
  { id: 'year', label: 'Ano' },
  { id: 'custom', label: 'De–até' },
];

export function SalesPeriodFilter({
  value,
  onChange,
  description,
}: {
  value: PeriodFilterValue;
  onChange: (value: PeriodFilterValue) => void;
  description?: string;
}) {
  const invalidCustom =
    value.preset === 'custom' &&
    value.customFrom &&
    value.customTo &&
    value.customFrom > value.customTo;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <CalendarRange className="h-4 w-4" />
            Período
          </span>
          <div
            className="inline-flex flex-wrap rounded-lg border border-border bg-muted/40 p-0.5"
            role="group"
            aria-label="Filtrar métricas por período"
          >
            {presets.map((p) => (
              <Button
                key={p.id}
                type="button"
                size="sm"
                variant={value.preset === p.id ? 'default' : 'ghost'}
                className={cn(
                  'h-7 rounded-md px-3',
                  value.preset === p.id && 'shadow-sm',
                )}
                onClick={() => onChange({ ...value, preset: p.id })}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </div>
        {description ? (
          <p className="text-sm text-muted-foreground sm:text-right">{description}</p>
        ) : null}
      </div>

      {value.preset === 'custom' ? (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 px-3 py-3 sm:flex-row sm:items-end">
          <label className="grid flex-1 gap-1 text-sm">
            <span className="font-medium text-foreground">De</span>
            <Input
              type="date"
              value={value.customFrom}
              onChange={(e) => onChange({ ...value, customFrom: e.target.value })}
            />
          </label>
          <label className="grid flex-1 gap-1 text-sm">
            <span className="font-medium text-foreground">Até</span>
            <Input
              type="date"
              value={value.customTo}
              onChange={(e) => onChange({ ...value, customTo: e.target.value })}
            />
          </label>
        </div>
      ) : null}

      {invalidCustom ? (
        <p className="text-sm text-destructive">A data inicial deve ser anterior ou igual à final.</p>
      ) : null}
    </div>
  );
}
