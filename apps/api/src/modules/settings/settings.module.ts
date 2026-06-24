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
import { ProfileAccessController } from './profile-access.controller';
import { ProfileAccessService } from './profile-access.service';
import { EmailNotificationsController } from './email-notifications.controller';
import { EmailNotificationsService } from './email-notifications.service';

@Module({
  controllers: [
    TenantSettingsController,
    ProfileAccessController,
    EmailNotificationsController,
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
    ProfileAccessService,
    EmailNotificationsService,
  ],
  exports: [
    TenantSettingsService,
    ConfigCatalogService,
    TenantBranchesService,
    ProfileAccessService,
    EmailNotificationsService,
  ],
})
export class SettingsModule {}
