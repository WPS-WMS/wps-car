'use client';

import { SettingsPageShell } from '@/components/settings/settings-page-shell';
import { ConfigCatalogManagement } from '@/components/settings/config-catalog-management';

export default function TiposVeiculoConfigPage() {
  return (
    <SettingsPageShell
      title="Tipos de veículo"
      description="Cadastre as classificações usadas no cadastro de veículos"
    >
      <ConfigCatalogManagement resource="vehicle-types" />
    </SettingsPageShell>
  );
}
