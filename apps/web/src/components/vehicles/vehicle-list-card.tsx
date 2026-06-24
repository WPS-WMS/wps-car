'use client';

import Link from 'next/link';
import { vehicleEditHref } from '@/lib/edit-routes';
import { formatCurrency } from '@/lib/format';
import { vehicleStatusLabels, vehicleStatusVariant } from '@/lib/labels';
import {
  useVehiclePhotoViewer,
  VehiclePhotoThumb,
} from '@/components/vehicles/vehicle-photo-viewer';
import { vehiclePhotoFullUrl, vehiclePhotoListUrl } from '@/lib/vehicle-photo';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { StockItem } from '@/types/api';

export function VehicleListCard({ item }: { item: StockItem }) {
  const yearLabel = item.year != null ? String(item.year) : '—';

  const fallbackPhoto = item.photo?.url
    ? {
        id: 'primary-preview',
        url: vehiclePhotoFullUrl(item.photo)!,
        fileName: `${item.brand} ${item.model}`,
        isPrimary: true,
      }
    : null;

  const viewer = useVehiclePhotoViewer({
    vehicleId: item.id,
    fallbackPhoto,
  });

  return (
    <>
      <Card className="flex gap-3 border border-border p-3 shadow-card transition-shadow hover:shadow-card-hover">
        <VehiclePhotoThumb
          path={vehiclePhotoListUrl(item.photo)}
          alt={`${item.brand} ${item.model}`}
          size="md"
          onClick={() => viewer.openAt(0)}
        />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground">
                {item.brand} {item.model}
              </p>
              <p className="text-sm text-muted-foreground">{yearLabel}</p>
            </div>
            <Badge variant={vehicleStatusVariant(item.status)} className="shrink-0">
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
      {viewer.lightbox}
    </>
  );
}
