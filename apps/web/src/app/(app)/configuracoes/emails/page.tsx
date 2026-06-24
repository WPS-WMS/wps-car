'use client';

import { SettingsPageShell } from '@/components/settings/settings-page-shell';
import { EmailNotificationsSettings } from '@/components/settings/email-notifications-settings';

export default function EmailsConfigPage() {
  return (
    <SettingsPageShell
      title="E-mails de notificação"
      description="Defina quem recebe cada e-mail automático e edite os modelos de mensagem"
    >
      <EmailNotificationsSettings />
    </SettingsPageShell>
  );
}
