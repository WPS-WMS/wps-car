import { BackLink } from '@/components/layout/back-link';
import { PageHeader } from '@/components/layout/page-header';

export function SettingsPageShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <BackLink href="/configuracoes" label="Voltar para configurações" />
      <PageHeader title={title} description={description} />
      {children}
    </div>
  );
}
