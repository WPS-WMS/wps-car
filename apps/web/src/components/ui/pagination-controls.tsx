'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type PaginationMetaLike = {
  page: number;
  totalPages: number;
  total?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
};

type PaginationControlsProps = {
  meta?: PaginationMetaLike | null;
  onPageChange: (page: number) => void;
  itemLabel?: string;
  className?: string;
  align?: 'between' | 'end';
};

export function PaginationControls({
  meta,
  onPageChange,
  itemLabel = 'itens',
  className,
  align = 'between',
}: PaginationControlsProps) {
  if (!meta || meta.totalPages <= 1) {
    return null;
  }

  const hasPrevious = meta.hasPreviousPage ?? meta.page > 1;
  const hasNext = meta.hasNextPage ?? meta.page < meta.totalPages;
  const totalLabel =
    meta.total !== undefined ? ` (${meta.total} ${itemLabel})` : '';

  return (
    <div
      className={cn(
        'flex flex-col gap-2 sm:flex-row sm:items-center',
        align === 'between' ? 'sm:justify-between' : 'sm:justify-end',
        className,
      )}
    >
      <p className="text-sm text-muted-foreground">
        Página {meta.page} de {meta.totalPages}
        {totalLabel}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!hasPrevious}
          onClick={() => onPageChange(meta.page - 1)}
        >
          Anterior
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!hasNext}
          onClick={() => onPageChange(meta.page + 1)}
        >
          Próxima
        </Button>
      </div>
    </div>
  );
}
