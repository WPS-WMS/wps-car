'use client';

import { SettingsPageShell } from '@/components/settings/settings-page-shell';
import { UsersManagement } from '@/components/users/users-management';

export default function ComissaoVendedorConfigPage() {
  return (
    <SettingsPageShell
      title="Comissão por vendedor"
      description="Defina o tipo e o valor de comissão para cada vendedor"
    >
      <UsersManagement sellerOnly />
    </SettingsPageShell>
  );
}
