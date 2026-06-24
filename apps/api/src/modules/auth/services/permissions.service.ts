import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CacheService } from '../../../infrastructure/cache/cache.service';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import {
  DEFAULT_PROFILE_ACCESS,
  PROFILE_ACCESS_SETTING_KEY,
  ProfileAccessRole,
  SIDEBAR_PERMISSION_CODES,
  isProfileAccessRole,
} from '../../settings/constants/profile-access';

type StoredProfileAccess = Partial<Record<ProfileAccessRole, string[]>>;

const CACHE_TTL_MS = 5 * 60 * 1000;
const cacheKey = (userId: string, role: UserRole, tenantId: string | null) =>
  `perm:${userId}:${role}:${tenantId ?? 'none'}`;

@Injectable()
export class PermissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async resolveForUser(
    userId: string,
    role: UserRole,
    tenantId: string | null,
  ): Promise<string[]> {
    const key = cacheKey(userId, role, tenantId);
    const cached = await this.cache.get<string[]>(key);
    if (cached) {
      return cached;
    }

    const permissions = await this.resolveForUserUncached(userId, role, tenantId);
    await this.cache.set(key, permissions, CACHE_TTL_MS);
    return permissions;
  }

  async invalidateForUser(userId: string) {
    await this.cache.deleteByPrefix(`perm:${userId}:`);
  }

  async invalidateForTenant(tenantId: string) {
    await this.cache.deleteWhere((key) => key.endsWith(`:${tenantId}`));
  }

  private async resolveForUserUncached(
    userId: string,
    role: UserRole,
    tenantId: string | null,
  ): Promise<string[]> {
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { role },
      include: { permission: true },
    });

    const userOverrides = await this.prisma.userPermission.findMany({
      where: { userId },
      include: { permission: true },
    });

    const codes = new Set(rolePermissions.map((rp) => rp.permission.code));

    for (const override of userOverrides) {
      if (override.granted) {
        codes.add(override.permission.code);
      } else {
        codes.delete(override.permission.code);
      }
    }

    if (tenantId && isProfileAccessRole(role)) {
      const tenantSidebarPermissions = await this.resolveTenantSidebarPermissions(
        tenantId,
        role,
      );

      for (const permissionCode of SIDEBAR_PERMISSION_CODES) {
        if (tenantSidebarPermissions.includes(permissionCode)) {
          codes.add(permissionCode);
        } else {
          codes.delete(permissionCode);
        }
      }
    }

    return Array.from(codes).sort();
  }

  private async resolveTenantSidebarPermissions(
    tenantId: string,
    role: ProfileAccessRole,
  ): Promise<string[]> {
    const row = await this.prisma.tenantSetting.findUnique({
      where: {
        tenantId_key: { tenantId, key: PROFILE_ACCESS_SETTING_KEY },
      },
    });

    if (!row?.value || typeof row.value !== 'object' || Array.isArray(row.value)) {
      return DEFAULT_PROFILE_ACCESS[role];
    }

    const stored = row.value as StoredProfileAccess;
    return stored[role] ?? DEFAULT_PROFILE_ACCESS[role];
  }
}
