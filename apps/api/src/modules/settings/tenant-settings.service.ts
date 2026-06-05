import { Injectable } from '@nestjs/common';
import {
  TENANT_SETTING_DEFAULTS,
  TENANT_SETTING_KEYS,
} from './constants/tenant-setting-keys';
import { UpsertTenantSettingsDto } from './dto/upsert-tenant-settings.dto';
import { TenantSettingsRepository } from './repositories/tenant-settings.repository';

@Injectable()
export class TenantSettingsService {
  constructor(private readonly repository: TenantSettingsRepository) {}

  async getAll() {
    const rows = await this.repository.findAll();
    const settings: Record<string, unknown> = { ...TENANT_SETTING_DEFAULTS };

    for (const row of rows) {
      settings[row.key] = row.value;
    }

    return {
      settings,
      knownKeys: Object.values(TENANT_SETTING_KEYS),
    };
  }

  async upsert(dto: UpsertTenantSettingsDto) {
    const entries = Object.entries(dto.settings).map(([key, value]) => ({
      key,
      value: value as object,
    }));

    await this.repository.upsertMany(entries);
    return this.getAll();
  }

  getDefaults() {
    return {
      settings: TENANT_SETTING_DEFAULTS,
      knownKeys: Object.values(TENANT_SETTING_KEYS),
    };
  }
}
