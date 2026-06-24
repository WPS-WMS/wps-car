'use client';

import { SettingsPageShell } from '@/components/settings/settings-page-shell';
import { ProfileAccessManagement } from '@/components/settings/profile-access-management';
import { useAuth } from '@/providers/auth-provider';

export default function GestaoPerfilPage() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <SettingsPageShell
        title="Gestão de perfil"
        description="Controle de acesso ao menu lateral por perfil"
      >
        <p className="text-sm text-muted-foreground">
          Somente administradores podem configurar o acesso de Gerente e Vendedor.
        </p>
      </SettingsPageShell>
    );
  }

  return (
    <SettingsPageShell
      title="Gestão de perfil"
      description="Defina quais funcionalidades do menu lateral cada perfil pode acessar"
    >
      <ProfileAccessManagement />
    </SettingsPageShell>
  );
}
