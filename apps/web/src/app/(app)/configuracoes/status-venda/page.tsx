'use client';

import { SettingsPageShell } from '@/components/settings/settings-page-shell';
import { StatusConfigManagement } from '@/components/settings/status-config-management';

export default function StatusVendaConfigPage() {
  return (
    <SettingsPageShell
      title="Status de venda"
      description="Status personalizados do funil de vendas"
    >
      <StatusConfigManagement entity="sale" />
    </SettingsPageShell>
  );
}
