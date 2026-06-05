'use client';

import { SettingsPageShell } from '@/components/settings/settings-page-shell';
import { TenantSettingsPanel } from '@/components/settings/tenant-settings-panel';

export default function MargensCompraConfigPage() {
  return (
    <SettingsPageShell
      title="Margens padrão de compra"
      description="Percentual de referência na análise e sugestão de valor de compra"
    >
      <TenantSettingsPanel keys={['default_purchase_margin_percent']} />
    </SettingsPageShell>
  );
}
