export const TENANT_SETTING_KEYS = {
  DEFAULT_MARGIN_PERCENT: 'default_margin_percent',
  DEFAULT_PURCHASE_MARGIN_PERCENT: 'default_purchase_margin_percent',
  ESTIMATED_PREP_COSTS_DEFAULT: 'estimated_prep_costs_default',
  COMPANY_DISPLAY_NAME: 'company_display_name',
  NOTIFICATION_EMAIL: 'notification_email',
} as const;

export type TenantSettingKey =
  (typeof TENANT_SETTING_KEYS)[keyof typeof TENANT_SETTING_KEYS];

export const TENANT_SETTING_DEFAULTS: Record<TenantSettingKey, unknown> = {
  [TENANT_SETTING_KEYS.DEFAULT_MARGIN_PERCENT]: 12,
  [TENANT_SETTING_KEYS.DEFAULT_PURCHASE_MARGIN_PERCENT]: 15,
  [TENANT_SETTING_KEYS.ESTIMATED_PREP_COSTS_DEFAULT]: 2000,
  [TENANT_SETTING_KEYS.COMPANY_DISPLAY_NAME]: '',
  [TENANT_SETTING_KEYS.NOTIFICATION_EMAIL]: '',
};
