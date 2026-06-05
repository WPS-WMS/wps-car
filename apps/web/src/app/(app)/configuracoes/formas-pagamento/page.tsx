'use client';

import { SettingsPageShell } from '@/components/settings/settings-page-shell';
import { ConfigCatalogManagement } from '@/components/settings/config-catalog-management';

export default function FormasPagamentoConfigPage() {
  return (
    <SettingsPageShell
      title="Formas de pagamento"
      description="Opções de pagamento disponíveis nas vendas"
    >
      <ConfigCatalogManagement resource="payment-methods" />
    </SettingsPageShell>
  );
}
