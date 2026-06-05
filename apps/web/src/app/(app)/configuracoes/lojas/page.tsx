'use client';

import { SettingsPageShell } from '@/components/settings/settings-page-shell';
import { StoreManagement } from '@/components/settings/store-management';

export default function LojasConfigPage() {
  return (
    <SettingsPageShell
      title="Filiais"
      description="A matriz é o tenant (sua empresa). Cadastre filiais vinculadas a ele."
    >
      <StoreManagement />
    </SettingsPageShell>
  );
}
