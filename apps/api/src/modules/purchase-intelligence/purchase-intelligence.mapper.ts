import { PurchaseIntelligenceQuery } from '@prisma/client';
import { decimalToString } from '../../common/utils/decimal.util';

export function toPurchaseIntelligenceQueryResponse(row: PurchaseIntelligenceQuery) {
  const raw =
    row.rawResponse && typeof row.rawResponse === 'object' && !Array.isArray(row.rawResponse)
      ? (row.rawResponse as Record<string, unknown>)
      : {};

  const fipeVehicle =
    raw.fipeVehicle && typeof raw.fipeVehicle === 'object'
      ? (raw.fipeVehicle as Record<string, unknown>)
      : null;

  return {
    id: row.id,
    licensePlate: row.licensePlate,
    fipeValue: decimalToString(row.fipeValue),
    desiredMarginPercent: decimalToString(row.desiredMarginPercent),
    estimatedCosts: decimalToString(row.estimatedCosts),
    maxPurchaseValue: decimalToString(row.maxPurchaseValue),
    provider: typeof raw.provider === 'string' ? raw.provider : null,
    brand: fipeVehicle?.brand ? String(fipeVehicle.brand) : null,
    model: fipeVehicle?.model ? String(fipeVehicle.model) : null,
    modelYear: fipeVehicle?.modelYear ? Number(fipeVehicle.modelYear) : null,
    existingVehicleId:
      typeof raw.existingVehicleId === 'string' ? raw.existingVehicleId : null,
    createdAt: row.createdAt,
    userId: row.userId,
  };
}
