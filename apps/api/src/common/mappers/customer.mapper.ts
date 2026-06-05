import { Customer, CustomerHistory, User } from '@prisma/client';

type CustomerWithSeller = Customer & {
  assignedSeller?: Pick<User, 'id' | 'name' | 'email'> | null;
};

export function toCustomerResponse(customer: CustomerWithSeller) {
  return {
    id: customer.id,
    tenantId: customer.tenantId,
    name: customer.name,
    document: customer.document,
    phone: customer.phone,
    email: customer.email,
    street: customer.street,
    number: customer.number,
    complement: customer.complement,
    neighborhood: customer.neighborhood,
    city: customer.city,
    state: customer.state,
    zipCode: customer.zipCode,
    personType: customer.personType,
    customerType: customer.customerType,
    notes: customer.notes,
    assignedSellerId: customer.assignedSellerId,
    assignedSeller: customer.assignedSeller,
    active: customer.active,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
    createdById: customer.createdById,
    updatedById: customer.updatedById,
  };
}

export function toCustomerHistoryResponse(entry: CustomerHistory) {
  return {
    id: entry.id,
    customerId: entry.customerId,
    action: entry.action,
    details: entry.details,
    userId: entry.userId,
    createdAt: entry.createdAt,
  };
}
