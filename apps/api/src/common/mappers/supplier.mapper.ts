import { Supplier, SupplierHistory } from '@prisma/client';

export function toSupplierResponse(supplier: Supplier) {
  return {
    id: supplier.id,
    tenantId: supplier.tenantId,
    name: supplier.name,
    document: supplier.document,
    phone: supplier.phone,
    email: supplier.email,
    street: supplier.street,
    number: supplier.number,
    complement: supplier.complement,
    neighborhood: supplier.neighborhood,
    city: supplier.city,
    state: supplier.state,
    zipCode: supplier.zipCode,
    personType: supplier.personType,
    category: supplier.category,
    notes: supplier.notes,
    active: supplier.active,
    createdAt: supplier.createdAt,
    updatedAt: supplier.updatedAt,
    createdById: supplier.createdById,
    updatedById: supplier.updatedById,
  };
}

export function toSupplierHistoryResponse(entry: SupplierHistory) {
  return {
    id: entry.id,
    supplierId: entry.supplierId,
    action: entry.action,
    details: entry.details,
    userId: entry.userId,
    createdAt: entry.createdAt,
  };
}
