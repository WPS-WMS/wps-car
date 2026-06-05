import { Module } from '@nestjs/common';
import { ConfigCatalogService } from './config-catalog.service';
import { ConfigCatalogRepository } from './repositories/config-catalog.repository';
import { TenantSettingsRepository } from './repositories/tenant-settings.repository';
import { TenantSettingsService } from './tenant-settings.service';
import { TenantSettingsController } from './tenant-settings.controller';
import {
  CostTypesConfigController,
  EmailTemplatesConfigController,
  PaymentMethodsConfigController,
  StatusesConfigController,
  VehicleTypesConfigController,
} from './settings-catalog.controller';
import { TenantBranchesController } from './tenant-branches.controller';
import { TenantBranchesService } from './tenant-branches.service';
import { TenantBranchesRepository } from './repositories/tenant-branches.repository';

@Module({
  controllers: [
    TenantSettingsController,
    VehicleTypesConfigController,
    CostTypesConfigController,
    PaymentMethodsConfigController,
    StatusesConfigController,
    EmailTemplatesConfigController,
    TenantBranchesController,
  ],
  providers: [
    TenantSettingsService,
    TenantSettingsRepository,
    ConfigCatalogService,
    ConfigCatalogRepository,
    TenantBranchesService,
    TenantBranchesRepository,
  ],
  exports: [TenantSettingsService, ConfigCatalogService, TenantBranchesService],
})
export class SettingsModule {}
