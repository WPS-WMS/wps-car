import type { VehiclePhoto } from '@/types/api';

type PhotoLike = Pick<VehiclePhoto, 'url' | 'thumbnailUrl'> | null | undefined;

/** URL leve para listagens; lightbox deve usar `url` (original). */
export function vehiclePhotoListUrl(photo: PhotoLike) {
  return photo?.thumbnailUrl ?? photo?.url ?? null;
}

export function vehiclePhotoFullUrl(photo: PhotoLike) {
  return photo?.url ?? null;
}
