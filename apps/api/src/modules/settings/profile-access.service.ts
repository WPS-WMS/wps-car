import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DomainException } from '../../domain/exceptions/domain.exception';
import {
  DEFAULT_PROFILE_ACCESS,
  PROFILE_ACCESS_ROLES,
  PROFILE_ACCESS_SETTING_KEY,
  ProfileAccessRole,
  SIDEBAR_FEATURES,
  featureMapToPermissions,
  permissionsToFeatureMap,
} from './constants/profile-access';
import { UpdateProfileAccessDto } from './dto/update-profile-access.dto';
import { TenantSettingsRepository } from './repositories/tenant-settings.repository';

type StoredProfileAccess = Partial<Record<ProfileAccessRole, string[]>>;

@Injectable()
export class ProfileAccessService {
  constructor(private readonly tenantSettingsRepository: TenantSettingsRepository) {}

  async getProfileAccess() {
    const stored = await this.readStoredAccess();

    return {
      roles: PROFILE_ACCESS_ROLES.map((role) => {
        const permissions = this.resolvePermissionsForRole(role, stored);
        return {
          role,
          label: role === 'MANAGER' ? 'Gerente' : 'Vendedor',
          features: SIDEBAR_FEATURES.map((feature) => ({
            ...feature,
            enabled: permissions.includes(feature.permission),
          })),
          enabledFeatures: SIDEBAR_FEATURES.filter((feature) =>
            permissions.includes(feature.permission),
          ).map((feature) => feature.id),
        };
      }),
      groups: [
        { id: 'principal', label: 'Menu principal' },
        { id: 'relatorios', label: 'Relatórios' },
        { id: 'sistema', label: 'Configurações' },
      ],
      defaults: DEFAULT_PROFILE_ACCESS,
      isCustomized: PROFILE_ACCESS_ROLES.some((role) => Boolean(stored?.[role])),
    };
  }

  async updateProfileAccess(dto: UpdateProfileAccessDto) {
    const validIds = new Set(SIDEBAR_FEATURES.map((feature) => feature.id));
    const invalid = dto.enabledFeatures.filter((id) => !validIds.has(id));

    if (invalid.length) {
      throw new DomainException(
        'INVALID_PROFILE_FEATURE',
        `Funcionalidade inválida: ${invalid.join(', ')}`,
        400,
      );
    }

    const featureMap = Object.fromEntries(
      SIDEBAR_FEATURES.map((feature) => [
        feature.id,
        dto.enabledFeatures.includes(feature.id),
      ]),
    );

    const permissions = featureMapToPermissions(featureMap);
    const stored = (await this.readStoredAccess()) ?? {};
    stored[dto.role] = permissions;

    await this.tenantSettingsRepository.upsertMany([
      {
        key: PROFILE_ACCESS_SETTING_KEY,
        value: stored as Prisma.InputJsonValue,
      },
    ]);

    return this.getProfileAccess();
  }

  async resolveSidebarPermissionsForRole(
    tenantId: string,
    role: ProfileAccessRole,
  ): Promise<string[] | null> {
    const stored = await this.readStoredAccessForTenant(tenantId);
    if (!stored?.[role]) {
      return null;
    }
    return this.resolvePermissionsForRole(role, stored);
  }

  private resolvePermissionsForRole(
    role: ProfileAccessRole,
    stored: StoredProfileAccess | null,
  ) {
    return stored?.[role] ?? DEFAULT_PROFILE_ACCESS[role];
  }

  private async readStoredAccess(): Promise<StoredProfileAccess | null> {
    const rows = await this.tenantSettingsRepository.findAll();
    const row = rows.find((item) => item.key === PROFILE_ACCESS_SETTING_KEY);
    if (!row?.value || typeof row.value !== 'object' || Array.isArray(row.value)) {
      return null;
    }
    return row.value as StoredProfileAccess;
  }

  private async readStoredAccessForTenant(
    tenantId: string,
  ): Promise<StoredProfileAccess | null> {
    const row = await this.tenantSettingsRepository.findByKeyForTenant(
      tenantId,
      PROFILE_ACCESS_SETTING_KEY,
    );
    if (!row?.value || typeof row.value !== 'object' || Array.isArray(row.value)) {
      return null;
    }
    return row.value as StoredProfileAccess;
  }
}

export { permissionsToFeatureMap, featureMapToPermissions };
