import { DEMO_TENANT_ALPHA, DEMO_TENANT_BETA } from '../prisma/seed-helpers';

export type ImportTenantKey = 'alpha' | 'beta';

export type ImportTenantConfig = {
  key: ImportTenantKey;
  cnpj: string;
  email: string;
  password: string;
  label: string;
};

function adminOf(spec: typeof DEMO_TENANT_ALPHA): ImportTenantConfig['email'] {
  const admin = spec.users.find((u) => u.role === 'ADMIN');
  if (!admin) throw new Error(`Tenant ${spec.name} sem usuário ADMIN no seed`);
  return admin.email;
}

export const IMPORT_TENANTS: Record<ImportTenantKey, ImportTenantConfig> = {
  alpha: {
    key: 'alpha',
    cnpj: DEMO_TENANT_ALPHA.cnpj,
    email: adminOf(DEMO_TENANT_ALPHA),
    password: 'Admin@123',
    label: DEMO_TENANT_ALPHA.name,
  },
  beta: {
    key: 'beta',
    cnpj: DEMO_TENANT_BETA.cnpj,
    email: adminOf(DEMO_TENANT_BETA),
    password: 'Admin@123',
    label: DEMO_TENANT_BETA.name,
  },
};

export function parseImportTenantKey(
  value: string | undefined,
): ImportTenantKey | 'all' | null {
  if (!value?.trim()) return null;
  const v = value.trim().toLowerCase();
  if (v === 'all' || v === 'ambos' || v === 'both') return 'all';
  if (v === 'alpha' || v === 'demo' || v === '00000000000191') return 'alpha';
  if (v === 'beta' || v === '11222333000181') return 'beta';
  return null;
}

/** Coluna opcional no CSV: tenant | empresa | cnpj */
export function resolveTenantKeyFromRow(
  row: Record<string, string>,
): ImportTenantKey | null {
  const raw = (row.tenant ?? row.empresa ?? row.tenant_cnpj ?? row.cnpj ?? '')
    .trim()
    .toLowerCase();
  if (!raw) return null;
  const parsed = parseImportTenantKey(raw);
  if (parsed === 'all' || parsed === null) return null;
  return parsed;
}

export function resolveTargetTenants(
  row: Record<string, string>,
  cliTenant: ImportTenantKey | 'all',
): ImportTenantKey[] {
  const rowKey = resolveTenantKeyFromRow(row);
  if (rowKey) return [rowKey];
  if (cliTenant === 'all') return ['alpha', 'beta'];
  return [cliTenant];
}

export function tenantFromEnv(): ImportTenantKey | 'all' {
  const fromCnpj = parseImportTenantKey(process.env.IMPORT_TENANT_CNPJ);
  if (fromCnpj === 'alpha' || fromCnpj === 'beta') return fromCnpj;

  const fromTenant = parseImportTenantKey(process.env.IMPORT_TENANT);
  if (fromTenant) return fromTenant;

  return 'alpha';
}
