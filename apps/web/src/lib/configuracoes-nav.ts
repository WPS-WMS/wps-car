import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  Car,
  Coins,
  CreditCard,
  Mail,
  Percent,
  Tag,
  UserCog,
  Users,
  Wallet,
} from 'lucide-react';

export type ConfigCardItem = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

export const configuracoesCards: ConfigCardItem[] = [
  {
    href: '/configuracoes/lojas',
    title: 'Filiais',
    description: 'Matriz é o tenant; cadastre filiais vinculadas à empresa',
    icon: Building2,
  },
  {
    href: '/configuracoes/usuarios',
    title: 'Usuários',
    description: 'Gerencie usuários, perfis e acessos da revenda',
    icon: Users,
  },
  {
    href: '/configuracoes/tipos-veiculo',
    title: 'Tipos de veículo',
    description: 'Classificações de veículos disponíveis no cadastro',
    icon: Car,
  },
  {
    href: '/configuracoes/tipos-custo',
    title: 'Tipos de custo',
    description: 'Categorias para lançamento de custos do veículo',
    icon: Coins,
  },
  {
    href: '/configuracoes/formas-pagamento',
    title: 'Formas de pagamento',
    description: 'Opções de pagamento nas vendas',
    icon: CreditCard,
  },
  {
    href: '/configuracoes/status-veiculo',
    title: 'Status de veículo',
    description: 'Status personalizados do fluxo de estoque',
    icon: Tag,
  },
  {
    href: '/configuracoes/status-venda',
    title: 'Status de venda',
    description: 'Status personalizados do funil de vendas',
    icon: Tag,
  },
  {
    href: '/configuracoes/margens-compra',
    title: 'Margens padrão de compra',
    description: 'Percentual de referência na análise de compra',
    icon: Percent,
  },
  {
    href: '/configuracoes/comissao-vendedor',
    title: 'Comissão por vendedor',
    description: 'Regras individuais de comissão para cada vendedor',
    icon: UserCog,
  },
  {
    href: '/configuracoes/comissao-empresa',
    title: 'Comissão padrão da empresa',
    description: 'Regra padrão quando o vendedor não tem comissão própria',
    icon: Wallet,
  },
  {
    href: '/configuracoes/emails',
    title: 'E-mails de notificação',
    description: 'E-mail de envio e templates de mensagens',
    icon: Mail,
  },
];
