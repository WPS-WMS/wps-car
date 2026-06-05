import { cn } from '@/lib/utils';

export function Toolbar({
  left,
  right,
  className,
}: {
  left?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-border bg-card/70 p-3 shadow-card backdrop-blur sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">{left}</div>
      <div className="flex flex-wrap items-center justify-end gap-2">{right}</div>
    </div>
  );
}

