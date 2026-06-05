import { Injectable } from '@nestjs/common';
import { AttachmentEntityType, Prisma } from '@prisma/client';
import { TenantScopedRepository } from '../../application/repositories/tenant-scoped.repository';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContextService } from '../tenant/tenant-context.service';

@Injectable()
export class AttachmentsRepository extends TenantScopedRepository {
  constructor(
    tenantContext: TenantContextService,
    private readonly prisma: PrismaService,
  ) {
    super(tenantContext);
  }

  private tenantId() {
    return this.tenantContext.requireTenantId();
  }

  findByEntity(entityType: AttachmentEntityType, entityId: string) {
    return this.prisma.attachment.findFirst({
      where: {
        tenantId: this.tenantId(),
        entityType,
        entityId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findManyByEntities(entityType: AttachmentEntityType, entityIds: string[]) {
    if (entityIds.length === 0) return Promise.resolve([]);
    return this.prisma.attachment.findMany({
      where: {
        tenantId: this.tenantId(),
        entityType,
        entityId: { in: entityIds },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(data: Prisma.AttachmentUncheckedCreateInput) {
    return this.prisma.attachment.create({ data });
  }

  delete(id: string) {
    return this.prisma.attachment.delete({ where: { id } });
  }

  deleteByEntity(entityType: AttachmentEntityType, entityId: string) {
    return this.prisma.attachment.deleteMany({
      where: {
        tenantId: this.tenantId(),
        entityType,
        entityId,
      },
    });
  }
}
