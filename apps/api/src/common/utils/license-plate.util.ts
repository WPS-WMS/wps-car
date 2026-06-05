export function normalizeLicensePlate(plate: string): string {
  return plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

export function isValidLicensePlate(plate: string): boolean {
  const normalized = normalizeLicensePlate(plate);
  return normalized.length >= 7 && normalized.length <= 8;
}
