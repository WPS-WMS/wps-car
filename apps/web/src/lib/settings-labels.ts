export const tenantSettingLabels: Record<string, { label: string; hint?: string; type: 'number' | 'text' | 'email' }> = {
  default_margin_percent: {
    label: 'Margem padrão de venda (%)',
    hint: 'Usada como referência nas análises de margem',
    type: 'number',
  },
  default_purchase_margin_percent: {
    label: 'Margem padrão na compra (%)',
    type: 'number',
  },
  estimated_prep_costs_default: {
    label: 'Custos estimados de preparação (R$)',
    type: 'number',
  },
  company_display_name: {
    label: 'Nome exibido da revenda',
    type: 'text',
  },
  notification_email: {
    label: 'E-mail de notificações',
    type: 'email',
  },
};

export const catalogSectionLabels = {
  vehicleTypes: 'Tipos de veículo',
  paymentMethods: 'Formas de pagamento',
  costTypes: 'Tipos de custo',
} as const;
