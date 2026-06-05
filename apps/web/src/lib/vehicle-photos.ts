export const MAX_VEHICLE_PHOTOS = 10;

export const VEHICLE_PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp';

export const VEHICLE_PHOTO_MIME_TYPES = VEHICLE_PHOTO_ACCEPT.split(',');

export function isAllowedVehiclePhoto(file: File): boolean {
  return VEHICLE_PHOTO_MIME_TYPES.includes(file.type);
}
