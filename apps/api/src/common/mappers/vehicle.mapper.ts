import {
  Vehicle,
  VehicleFinancial,
  VehiclePhoto,
  VehicleCost,
} from '@prisma/client';
import { decimalToString } from '../utils/decimal.util';

type VehicleWithRelations = Vehicle & {
  photos?: VehiclePhoto[];
  financial?: VehicleFinancial | null;
  costs?: VehicleCost[];
};

export function toPhotoResponse(photo: VehiclePhoto) {
  return {
    id: photo.id,
    fileName: photo.fileName,
    filePath: photo.filePath,
    url: `/uploads/${photo.filePath}`,
    mimeType: photo.mimeType,
    sizeBytes: photo.sizeBytes,
    sortOrder: photo.sortOrder,
    isPrimary: photo.isPrimary,
    createdAt: photo.createdAt,
  };
}

export function toFinancialSummary(financial: VehicleFinancial | null | undefined) {
  if (!financial) return null;

  return {
    purchaseValue: decimalToString(financial.purchaseValue),
    purchaseDate: financial.purchaseDate,
    fipeValue: decimalToString(financial.fipeValue),
    suggestedPurchaseValue: decimalToString(financial.suggestedPurchaseValue),
    listedValue: decimalToString(financial.listedValue),
    minimumValue: decimalToString(financial.minimumValue),
    saleValue: decimalToString(financial.saleValue),
    saleDate: financial.saleDate,
    totalCosts: decimalToString(financial.totalCosts),
    commissionValue: decimalToString(financial.commissionValue),
    grossProfit: decimalToString(financial.grossProfit),
    marginAmount: decimalToString(financial.marginAmount),
    marginPercent: decimalToString(financial.marginPercent),
    netResult: decimalToString(financial.netResult),
    daysInStock: financial.daysInStock,
    calculatedAt: financial.calculatedAt,
  };
}

export function toVehicleResponse(vehicle: VehicleWithRelations) {
  const primaryPhoto = vehicle.photos?.find((p) => p.isPrimary) ?? vehicle.photos?.[0];

  return {
    id: vehicle.id,
    tenantId: vehicle.tenantId,
    type: vehicle.type,
    brand: vehicle.brand,
    model: vehicle.model,
    version: vehicle.version,
    manufactureYear: vehicle.manufactureYear,
    modelYear: vehicle.modelYear,
    licensePlate: vehicle.licensePlate,
    renavam: vehicle.renavam,
    chassis: vehicle.chassis,
    color: vehicle.color,
    mileage: vehicle.mileage,
    fuel: vehicle.fuel,
    transmission: vehicle.transmission,
    doors: vehicle.doors,
    category: vehicle.category,
    status: vehicle.status,
    notes: vehicle.notes,
    financial: toFinancialSummary(vehicle.financial),
    primaryPhoto: primaryPhoto ? toPhotoResponse(primaryPhoto) : null,
    photos: vehicle.photos?.map(toPhotoResponse),
    createdAt: vehicle.createdAt,
    updatedAt: vehicle.updatedAt,
    createdById: vehicle.createdById,
    updatedById: vehicle.updatedById,
  };
}

export function toStockItemResponse(vehicle: VehicleWithRelations) {
  const financial = vehicle.financial;
  const purchaseValue = financial ? Number(financial.purchaseValue.toString()) : 0;
  const totalCosts = financial ? Number(financial.totalCosts.toString()) : 0;
  const listedValue = financial?.listedValue
    ? Number(financial.listedValue.toString())
    : null;
  const saleValue = financial?.saleValue ? Number(financial.saleValue.toString()) : null;

  const expectedMargin =
    listedValue !== null ? listedValue - purchaseValue - totalCosts : null;

  const primaryPhoto = vehicle.photos?.find((p) => p.isPrimary) ?? vehicle.photos?.[0];

  return {
    id: vehicle.id,
    photo: primaryPhoto ? toPhotoResponse(primaryPhoto) : null,
    licensePlate: vehicle.licensePlate,
    brand: vehicle.brand,
    model: vehicle.model,
    version: vehicle.version,
    year: vehicle.modelYear,
    purchaseValue: decimalToString(financial?.purchaseValue) ?? '0',
    totalCosts: decimalToString(financial?.totalCosts) ?? '0',
    listedValue: decimalToString(financial?.listedValue),
    saleValue: decimalToString(financial?.saleValue),
    expectedMargin: expectedMargin !== null ? expectedMargin.toFixed(2) : null,
    status: vehicle.status,
    daysInStock: financial?.daysInStock ?? null,
  };
}
