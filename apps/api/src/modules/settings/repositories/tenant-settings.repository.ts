import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TenantScopedRepository } from '../../../application/repositories/tenant-scoped.repository';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { TenantContextService } from '../../../infrastructure/tenant/tenant-context.service';

@Injectable()
export class TenantSettingsRepository extends TenantScopedRepository {
  constructor(
    tenantContext: TenantContextService,
    private readonly prisma: PrismaService,
  ) {
    super(tenantContext);
  }

  private tenantId() {
    return this.tenantContext.requireTenantId();
  }

  async findAll() {
    return this.prisma.tenantSetting.findMany({
      where: { tenantId: this.tenantId() },
      orderBy: { key: 'asc' },
    });
  }

  async upsertMany(entries: { key: string; value: Prisma.InputJsonValue }[]) {
    const tenantId = this.tenantId();

    return this.prisma.$transaction(
      entries.map((entry) =>
        this.prisma.tenantSetting.upsert({
          where: { tenantId_key: { tenantId, key: entry.key } },
          create: { tenantId, key: entry.key, value: entry.value },
          update: { value: entry.value },
        }),
      ),
    );
  }
}
