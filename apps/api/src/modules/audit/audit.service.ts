import { Injectable } from '@nestjs/common';
import { AuditAction, Prisma, UserRole } from '@prisma/client';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { resolvePagination } from '../../common/utils/pagination.util';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto';

export type AuditLogInput = {
  action: AuditAction;
  userId?: string | null;
  tenantId?: string | null;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: AuditLogInput) {
    await this.prisma.auditLog.create({
      data: {
        action: input.action,
        userId: input.userId ?? null,
        tenantId: input.tenantId ?? null,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
  }

  async findMany(query: ListAuditLogsQueryDto, actor: AuthenticatedUser) {
    const { page, limit, skip } = resolvePagination(query);

    const where: Prisma.AuditLogWhereInput = {
      ...(actor.role !== UserRole.MODERATOR && actor.tenantId
        ? { tenantId: actor.tenantId }
        : {}),
      ...(query.action && { action: query.action }),
      ...(query.userId && { userId: query.userId }),
    };

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return new PaginatedResponseDto(data, total, page, limit);
  }
}
