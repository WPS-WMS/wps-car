'use client';

import { SettingsPageShell } from '@/components/settings/settings-page-shell';
import { UsersManagement } from '@/components/users/users-management';

export default function UsuariosConfigPage() {
  return (
    <SettingsPageShell
      title="Usuários"
      description="Gerencie usuários, permissões e acessos da revenda"
    >
      <UsersManagement />
    </SettingsPageShell>
  );
}

