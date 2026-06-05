'use client';

import { SettingsPageShell } from '@/components/settings/settings-page-shell';
import { EmailNotificationsSettings } from '@/components/settings/email-notifications-settings';

export default function EmailsConfigPage() {
  return (
    <SettingsPageShell
      title="E-mails de notificação"
      description="Configure o e-mail de envio e os templates de mensagens"
    >
      <EmailNotificationsSettings />
    </SettingsPageShell>
  );
}
