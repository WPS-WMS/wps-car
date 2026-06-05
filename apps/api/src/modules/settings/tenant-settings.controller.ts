import { Body, Controller, Get, Patch } from '@nestjs/common';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { UpsertTenantSettingsDto } from './dto/upsert-tenant-settings.dto';
import { TenantSettingsService } from './tenant-settings.service';

@Controller('settings')
export class TenantSettingsController {
  constructor(private readonly service: TenantSettingsService) {}

  @Get()
  @Permissions('settings:read')
  getAll() {
    return this.service.getAll();
  }

  @Get('defaults')
  @Permissions('settings:read')
  getDefaults() {
    return this.service.getDefaults();
  }

  @Patch()
  @Permissions('settings:update')
  upsert(@Body() dto: UpsertTenantSettingsDto) {
    return this.service.upsert(dto);
  }
}
