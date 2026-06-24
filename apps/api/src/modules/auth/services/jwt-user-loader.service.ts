import { Injectable } from '@nestjs/common';
import { CacheService } from '../../../infrastructure/cache/cache.service';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { PermissionsService } from './permissions.service';

const CACHE_TTL_MS = 5 * 60 * 1000;
const cacheKey = (userId: string) => `jwt:user:${userId}`;

/** Singleton usado pelo Passport JWT (não pode depender de providers request-scoped). */
@Injectable()
export class JwtUserLoaderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionsService: PermissionsService,
    private readonly cache: CacheService,
  ) {}

  async invalidate(userId: string) {
    await this.cache.delete(cacheKey(userId));
  }

  async loadById(userId: string): Promise<AuthenticatedUser | null> {
    const cached = await this.cache.get<AuthenticatedUser>(cacheKey(userId));
    if (cached) {
      return cached;
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.active) {
      await this.cache.delete(cacheKey(userId));
      return null;
    }

    const permissions = await this.permissionsService.resolveForUser(
      user.id,
      user.role,
      user.tenantId,
    );

    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      branchId: user.branchId,
      permissions,
    };

    await this.cache.set(cacheKey(userId), authenticatedUser, CACHE_TTL_MS);

    return authenticatedUser;
  }
}
