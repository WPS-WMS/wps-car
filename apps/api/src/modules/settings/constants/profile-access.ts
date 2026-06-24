import { UserRole } from '@prisma/client';

export const PROFILE_ACCESS_SETTING_KEY = 'profile_access';

export type ProfileAccessRole = 'MANAGER' | 'SELLER';

export type SidebarFeatureGroup = 'principal' | 'cadastro' | 'relatorios' | 'sistema';

export interface SidebarFeatureDefinition {
  id: string;
  label: string;
  description: string;
  permission: string;
  group: SidebarFeatureGroup;
}

export const SIDEBAR_FEATURES: SidebarFeatureDefinition[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Painel gerencial ou de desempenho do vendedor',
    permission: 'dashboard:read',
    group: 'principal',
  },
  {
    id: 'vehicles',
    label: 'Veículos e produtos',
    description: 'Cadastro e consulta de veículos e produtos',
    permission: 'vehicles:read',
    group: 'principal',
  },
  {
    id: 'stock',
    label: 'Estoque',
    description: 'Visão e movimentação do estoque',
    permission: 'stock:read',
    group: 'principal',
  },
  {
    id: 'purchase-intelligence',
    label: 'Compra inteligente',
    description: 'Consulta FIPE por placa e valor máximo de compra',
    permission: 'purchase-intelligence:read',
    group: 'principal',
  },
  {
    id: 'pricing-intelligence',
    label: 'Precificação inteligente',
    description: 'Sugestão de preço de venda com FIPE, histórico e mercado',
    permission: 'pricing-intelligence:read',
    group: 'principal',
  },
  {
    id: 'sales',
    label: 'Vendas',
    description: 'Funil e registro de vendas',
    permission: 'sales:read',
    group: 'principal',
  },
  {
    id: 'crm',
    label: 'CRM comercial',
    description: 'Leads, oportunidades e lembretes de follow-up',
    permission: 'crm:read',
    group: 'principal',
  },
  {
    id: 'customers',
    label: 'Clientes',
    description: 'Cadastro de clientes (Configurações)',
    permission: 'customers:read',
    group: 'sistema',
  },
  {
    id: 'suppliers',
    label: 'Fornecedores',
    description: 'Cadastro de fornecedores (Configurações)',
    permission: 'suppliers:read',
    group: 'sistema',
  },
  {
    id: 'reports-general',
    label: 'Relatório geral',
    description: 'Relatório consolidado da revenda',
    permission: 'reports:read',
    group: 'relatorios',
  },
  {
    id: 'reports-commission',
    label: 'Relatório de comissão',
    description: 'Comissões por vendedor e período',
    permission: 'commissions:read',
    group: 'relatorios',
  },
  {
    id: 'settings',
    label: 'Configurações',
    description: 'Acesso ao menu de configurações da revenda',
    permission: 'settings:read',
    group: 'sistema',
  },
];

export const SIDEBAR_PERMISSION_CODES = SIDEBAR_FEATURES.map((f) => f.permission);

const DEFAULT_MANAGER_PERMISSIONS = [
  'dashboard:read',
  'vehicles:read',
  'stock:read',
  'purchase-intelligence:read',
  'pricing-intelligence:read',
  'sales:read',
  'crm:read',
  'customers:read',
  'suppliers:read',
  'reports:read',
  'commissions:read',
  'settings:read',
];

const DEFAULT_SELLER_PERMISSIONS = [
  'dashboard:read',
  'vehicles:read',
  'stock:read',
  'purchase-intelligence:read',
  'pricing-intelligence:read',
  'sales:read',
  'crm:read',
  'customers:read',
  'reports:read',
  'commissions:read',
];

export const DEFAULT_PROFILE_ACCESS: Record<ProfileAccessRole, string[]> = {
  MANAGER: DEFAULT_MANAGER_PERMISSIONS,
  SELLER: DEFAULT_SELLER_PERMISSIONS,
};

export const PROFILE_ACCESS_ROLES: ProfileAccessRole[] = ['MANAGER', 'SELLER'];

export function isProfileAccessRole(role: UserRole): role is ProfileAccessRole {
  return role === UserRole.MANAGER || role === UserRole.SELLER;
}

export function permissionsToFeatureMap(
  permissions: string[],
): Record<string, boolean> {
  const enabled = new Set(permissions);
  return Object.fromEntries(
    SIDEBAR_FEATURES.map((feature) => [feature.id, enabled.has(feature.permission)]),
  );
}

export function featureMapToPermissions(
  features: Record<string, boolean>,
): string[] {
  return SIDEBAR_FEATURES.filter((feature) => features[feature.id]).map(
    (feature) => feature.permission,
  );
}
