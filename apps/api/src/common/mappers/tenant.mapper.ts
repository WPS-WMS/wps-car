import { Tenant } from '@prisma/client';

export function toTenantResponse(tenant: Tenant) {
  return {
    id: tenant.id,
    name: tenant.name,
    cnpj: tenant.cnpj,
    email: tenant.email,
    phone: tenant.phone,
    status: tenant.status,
    plan: tenant.plan,
    createdAt: tenant.createdAt,
    updatedAt: tenant.updatedAt,
  };
}
