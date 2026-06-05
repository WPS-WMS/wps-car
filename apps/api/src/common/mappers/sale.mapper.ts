import { Sale, Customer, User, Vehicle } from '@prisma/client';
import { decimalToString } from '../utils/decimal.util';

type SaleWithRelations = Sale & {
  vehicle?: Pick<Vehicle, 'id' | 'brand' | 'model' | 'licensePlate' | 'status'> | null;
  customer?: Pick<Customer, 'id' | 'name' | 'document' | 'phone'> | null;
  seller?: Pick<User, 'id' | 'name' | 'email'> | null;
};

export function toSaleResponse(sale: SaleWithRelations) {
  return {
    id: sale.id,
    tenantId: sale.tenantId,
    vehicleId: sale.vehicleId,
    vehicle: sale.vehicle,
    customerId: sale.customerId,
    customer: sale.customer,
    sellerId: sale.sellerId,
    seller: sale.seller,
    amount: decimalToString(sale.amount),
    paymentMethod: sale.paymentMethod,
    saleDate: sale.saleDate,
    status: sale.status,
    commission: decimalToString(sale.commission),
    notes: sale.notes,
    createdAt: sale.createdAt,
    updatedAt: sale.updatedAt,
    createdById: sale.createdById,
    updatedById: sale.updatedById,
  };
}
