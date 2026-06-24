import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  CarFront,
  Percent,
  Sparkles,
  Tags,
  Contact,
} from 'lucide-react';

export type SidebarNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  permission: string;
};

export const MAIN_NAV_ITEMS: SidebarNavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    permission: 'dashboard:read',
  },
  {
    href: '/veiculos',
    label: 'Veículos e produtos',
    icon: CarFront,
    permission: 'vehicles:read',
  },
  {
    href: '/estoque',
    label: 'Estoque',
    icon: Package,
    permission: 'stock:read',
  },
  {
    href: '/compra-inteligente',
    label: 'Compra inteligente',
    icon: Sparkles,
    permission: 'purchase-intelligence:read',
  },
  {
    href: '/precificacao-inteligente',
    label: 'Precificação inteligente',
    icon: Tags,
    permission: 'pricing-intelligence:read',
  },
  {
    href: '/vendas',
    label: 'Vendas',
    icon: ShoppingCart,
    permission: 'sales:read',
  },
  {
    href: '/crm',
    label: 'CRM comercial',
    icon: Contact,
    permission: 'crm:read',
  },
];

export const RELATORIOS_NAV_ITEMS: SidebarNavItem[] = [
  {
    href: '/relatorios/geral',
    label: 'Relatório geral',
    icon: LayoutDashboard,
    permission: 'reports:read',
  },
  {
    href: '/relatorios/comissoes',
    label: 'Relatório de comissão',
    icon: Percent,
    permission: 'commissions:read',
  },
];

export const SETTINGS_NAV_ITEM: SidebarNavItem = {
  href: '/configuracoes',
  label: 'Configurações',
  icon: Settings,
  permission: 'settings:read',
};

export const RELATORIOS_NAV_META = {
  label: 'Relatórios',
  icon: BarChart3,
};
