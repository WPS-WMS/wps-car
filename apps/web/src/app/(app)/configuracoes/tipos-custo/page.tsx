'use client';

import { SettingsPageShell } from '@/components/settings/settings-page-shell';
import { ConfigCatalogManagement } from '@/components/settings/config-catalog-management';

export default function TiposCustoConfigPage() {
  return (
    <SettingsPageShell
      title="Tipos de custo"
      description="Categorias para lançamento de custos do veículo"
    >
      <ConfigCatalogManagement resource="cost-types" />
    </SettingsPageShell>
  );
}
