import { Attachment, VehicleCost, VehicleFinancial } from '@prisma/client';
import { toAttachmentResponse } from './attachment.mapper';
import { decimalToString } from '../utils/decimal.util';

type FinancialWithRelations = VehicleFinancial & {
  supplier?: { id: string; name: string } | null;
  customer?: { id: string; name: string } | null;
  seller?: { id: string; name: string } | null;
};

export function toFinancialDetailResponse(financial: FinancialWithRelations) {
  return {
    id: financial.id,
    vehicleId: financial.vehicleId,
    purchaseValue: decimalToString(financial.purchaseValue),
    purchaseDate: financial.purchaseDate,
    supplierId: financial.supplierId,
    supplier: financial.supplier,
    fipeValue: decimalToString(financial.fipeValue),
    suggestedPurchaseValue: decimalToString(financial.suggestedPurchaseValue),
    listedValue: decimalToString(financial.listedValue),
    minimumValue: decimalToString(financial.minimumValue),
    saleValue: decimalToString(financial.saleValue),
    saleDate: financial.saleDate,
    customerId: financial.customerId,
    customer: financial.customer,
    sellerId: financial.sellerId,
    seller: financial.seller,
    totalCosts: decimalToString(financial.totalCosts),
    commissionValue: decimalToString(financial.commissionValue),
    grossProfit: decimalToString(financial.grossProfit),
    marginAmount: decimalToString(financial.marginAmount),
    marginPercent: decimalToString(financial.marginPercent),
    netResult: decimalToString(financial.netResult),
    daysInStock: financial.daysInStock,
    calculatedAt: financial.calculatedAt,
    createdAt: financial.createdAt,
    updatedAt: financial.updatedAt,
  };
}

export function toVehicleCostResponse(
  cost: VehicleCost & {
    supplier?: { id: string; name: string } | null;
    responsible?: { id: string; name: string } | null;
    createdBy?: { id: string; name: string } | null;
  },
  receipt?: Attachment | null,
) {
  return {
    id: cost.id,
    vehicleId: cost.vehicleId,
    type: cost.type,
    description: cost.description,
    amount: decimalToString(cost.amount),
    costDate: cost.costDate,
    supplierId: cost.supplierId,
    supplier: cost.supplier,
    responsibleId: cost.responsibleId,
    responsible: cost.responsible,
    createdById: cost.createdById,
    createdBy: cost.createdBy,
    receipt: receipt ? toAttachmentResponse(receipt) : null,
    createdAt: cost.createdAt,
    updatedAt: cost.updatedAt,
    updatedById: cost.updatedById,
  };
}

export function toFinancialResultSummary(financial: VehicleFinancial) {
  return {
    purchaseValue: decimalToString(financial.purchaseValue),
    totalCosts: decimalToString(financial.totalCosts),
    saleValue: decimalToString(financial.saleValue),
    commissionValue: decimalToString(financial.commissionValue),
    grossProfit: decimalToString(financial.grossProfit),
    marginAmount: decimalToString(financial.marginAmount),
    marginPercent: decimalToString(financial.marginPercent),
    netResult: decimalToString(financial.netResult),
    daysInStock: financial.daysInStock,
    calculatedAt: financial.calculatedAt,
  };
}
