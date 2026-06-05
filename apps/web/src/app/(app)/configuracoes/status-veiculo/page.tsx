'use client';

import { SettingsPageShell } from '@/components/settings/settings-page-shell';
import { StatusConfigManagement } from '@/components/settings/status-config-management';

export default function StatusVeiculoConfigPage() {
  return (
    <SettingsPageShell
      title="Status de veículo"
      description="Status personalizados do fluxo de estoque"
    >
      <StatusConfigManagement entity="vehicle" />
    </SettingsPageShell>
  );
}
