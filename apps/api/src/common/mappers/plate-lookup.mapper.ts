import {
  StockMovement,
  Vehicle,
  VehicleCost,
  VehicleFinancial,
  VehiclePhoto,
  Sale,
  Customer,
  User,
  TenantBranch,
} from '@prisma/client';
import { toFinancialDetailResponse, toVehicleCostResponse } from './financial.mapper';
import { toSaleResponse } from './sale.mapper';
import { toStockMovementResponse } from './stock.mapper';
import { toVehicleResponse } from './vehicle.mapper';

type VehicleWithRelations = Vehicle & {
  photos?: VehiclePhoto[];
  financial?: VehicleFinancial | null;
  branch?: Pick<TenantBranch, 'id' | 'name'> | null;
};

type SaleWithRelations = Sale & {
  customer?: Pick<Customer, 'id' | 'name' | 'document' | 'phone'> | null;
  seller?: Pick<User, 'id' | 'name' | 'email'> | null;
  vehicle?: Pick<Vehicle, 'id' | 'brand' | 'model' | 'licensePlate' | 'status'> | null;
};

type CostWithRelations = VehicleCost & {
  supplier?: { id: string; name: string } | null;
  responsible?: { id: string; name: string } | null;
  createdBy?: { id: string; name: string } | null;
};

type MovementWithRelations = StockMovement & {
  user?: { id: string; name: string; email?: string } | null;
};

export function toPlateLookupResponse(params: {
  plate: string;
  vehicle: VehicleWithRelations | null;
  sales: SaleWithRelations[];
  costs: CostWithRelations[];
  movements: MovementWithRelations[];
}) {
  const { plate, vehicle, sales, costs, movements } = params;

  if (!vehicle) {
    return { found: false as const, plate };
  }

  const financial = vehicle.financial
    ? toFinancialDetailResponse(vehicle.financial)
    : null;

  return {
    found: true as const,
    plate,
    vehicle: toVehicleResponse(vehicle),
    purchase: financial
      ? {
          purchaseValue: financial.purchaseValue,
          purchaseDate: financial.purchaseDate,
          supplier: financial.supplier,
          fipeValue: financial.fipeValue,
          suggestedPurchaseValue: financial.suggestedPurchaseValue,
          listedValue: financial.listedValue,
          minimumValue: financial.minimumValue,
        }
      : null,
    sales: sales.map(toSaleResponse),
    costs: costs.map((cost) => toVehicleCostResponse(cost)),
    financialResult: financial
      ? {
          purchaseValue: financial.purchaseValue,
          totalCosts: financial.totalCosts,
          saleValue: financial.saleValue,
          commissionValue: financial.commissionValue,
          grossProfit: financial.grossProfit,
          marginAmount: financial.marginAmount,
          marginPercent: financial.marginPercent,
          netResult: financial.netResult,
          daysInStock: financial.daysInStock,
          calculatedAt: financial.calculatedAt,
        }
      : null,
    stockMovements: movements.map(toStockMovementResponse),
  };
}
