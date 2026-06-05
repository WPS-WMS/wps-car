import { IsObject } from 'class-validator';

export class UpsertTenantSettingsDto {
  @IsObject()
  settings!: Record<string, unknown>;
}
