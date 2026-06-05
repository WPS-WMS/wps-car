'use client';

import Image from 'next/image';
import Link from 'next/link';
import { vehicleEditHref } from '@/lib/edit-routes';
import { mediaUrl } from '@/lib/media';
import { formatCurrency } from '@/lib/format';
import { vehicleStatusLabels, vehicleStatusVariant } from '@/lib/labels';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { StockItem } from '@/types/api';

export function VehicleListCard({ item }: { item: StockItem }) {
  const src = mediaUrl(item.photo?.url);
  const yearLabel =
    item.year != null ? String(item.year) : '—';

  return (
    <Card className="overflow-hidden border border-border shadow-card transition-shadow hover:shadow-card-hover">
      <div className="relative aspect-[16/10] bg-muted">
        {src ? (
          <Image src={src} alt="" fill className="object-cover" unoptimized />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Sem foto
          </div>
        )}
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-foreground">
              {item.brand} {item.model}
            </p>
            <p className="text-sm text-muted-foreground">{yearLabel}</p>
          </div>
          <Badge variant={vehicleStatusVariant(item.status)}>
            {vehicleStatusLabels[item.status] ?? item.status}
          </Badge>
        </div>
        <p className="text-lg font-bold text-brand-600">
          {formatCurrency(item.listedValue ?? item.purchaseValue)}
        </p>
        <Link
          href={vehicleEditHref(item.id)}
          className="text-xs font-medium text-brand-600 hover:underline"
        >
          Ver detalhes
        </Link>
      </div>
    </Card>
  );
}
