'use client';

import {
  useVehiclePhotoViewer,
  VehiclePhotoThumb,
} from '@/components/vehicles/vehicle-photo-viewer';
import type { StockItem } from '@/types/api';

type VehicleStockPhotoCellProps = {
  vehicleId: string;
  photoUrl: string | null | undefined;
  photoThumbUrl?: string | null | undefined;
  label: string;
};

export function VehicleStockPhotoCell({
  vehicleId,
  photoUrl,
  photoThumbUrl,
  label,
}: VehicleStockPhotoCellProps) {
  const fallbackPhoto = photoUrl
    ? {
        id: 'primary-preview',
        url: photoUrl,
        fileName: label,
        isPrimary: true,
      }
    : null;

  const viewer = useVehiclePhotoViewer({
    vehicleId,
    fallbackPhoto,
  });

  return (
    <>
      <VehiclePhotoThumb
        path={photoThumbUrl ?? photoUrl}
        alt={label}
        size="xs"
        onClick={photoUrl ? () => viewer.openAt(0) : undefined}
      />
      {viewer.lightbox}
    </>
  );
}

export function vehicleStockPhotoFallback(item: Pick<StockItem, 'brand' | 'model'>) {
  return `${item.brand} ${item.model}`.trim();
}
