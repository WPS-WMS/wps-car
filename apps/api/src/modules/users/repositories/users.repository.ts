import { Injectable } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { TenantScopedRepository } from '../../../application/repositories/tenant-scoped.repository';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { TenantContextService } from '../../../infrastructure/tenant/tenant-context.service';
import { resolvePagination } from '../../../common/utils/pagination.util';
import { ListUsersQueryDto } from '../dto/list-users-query.dto';

@Injectable()
export class UsersRepository extends TenantScopedRepository {
  constructor(
    tenantContext: TenantContextService,
    private readonly prisma: PrismaService,
  ) {
    super(tenantContext);
  }

  async findManyPaginated(query: ListUsersQueryDto) {
    const { page, limit, skip, orderBy } = resolvePagination(query);
    const tenantId = this.tenantContext.requireTenantId();

    const where: Prisma.UserWhereInput = {
      tenantId,
      ...(query.role
        ? { role: query.role }
        : { role: { not: UserRole.MODERATOR } }),
      ...(query.active !== undefined && { active: query.active }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: orderBy ?? { createdAt: 'desc' },
        include: {
          branch: { select: { id: true, name: true } },
          rolePermissions: { include: { permission: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findByIdInTenant(id: string) {
    return this.prisma.user.findFirst({
      where: { id, tenantId: this.tenantContext.requireTenantId() },
      include: {
        branch: { select: { id: true, name: true } },
        rolePermissions: { include: { permission: true } },
      },
    });
  }

  async findByEmailInTenant(email: string) {
    return this.prisma.user.findFirst({
      where: {
        email,
        tenantId: this.tenantContext.requireTenantId(),
      },
    });
  }

  async create(data: Prisma.UserUncheckedCreateInput) {
    return this.prisma.user.create({
      data,
      include: {
        branch: { select: { id: true, name: true } },
        rolePermissions: { include: { permission: true } },
      },
    });
  }

  async update(id: string, data: Prisma.UserUncheckedUpdateInput) {
    return this.prisma.user.update({
      where: { id },
      data,
      include: {
        branch: { select: { id: true, name: true } },
        rolePermissions: { include: { permission: true } },
      },
    });
  }

  async revokeAllSessions(userId: string) {
    return this.prisma.$transaction([
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { tokenVersion: { increment: 1 } },
      }),
    ]);
  }

  async replacePermissionOverrides(
    userId: string,
    overrides: { permissionId: string; granted: boolean }[],
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.userPermission.deleteMany({ where: { userId } });

      if (overrides.length > 0) {
        await tx.userPermission.createMany({
          data: overrides.map((o) => ({
            userId,
            permissionId: o.permissionId,
            granted: o.granted,
          })),
        });
      }

      return tx.user.findUniqueOrThrow({
        where: { id: userId },
        include: {
          branch: { select: { id: true, name: true } },
          rolePermissions: { include: { permission: true } },
        },
      });
    });
  }

  async countAdminsInTenant(tenantId: string, excludeUserId?: string) {
    return this.prisma.user.count({
      where: {
        tenantId,
        role: UserRole.ADMIN,
        active: true,
        ...(excludeUserId && { id: { not: excludeUserId } }),
      },
    });
  }
}
