import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TenantScopedRepository } from '../../../application/repositories/tenant-scoped.repository';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { TenantContextService } from '../../../infrastructure/tenant/tenant-context.service';
import { resolvePagination } from '../../../common/utils/pagination.util';
import { normalizeLicensePlate } from '../../../common/utils/license-plate.util';
import { ListPurchaseHistoryQueryDto } from '../dto/list-purchase-history-query.dto';

@Injectable()
export class PurchaseIntelligenceRepository extends TenantScopedRepository {
  constructor(
    tenantContext: TenantContextService,
    private readonly prisma: PrismaService,
  ) {
    super(tenantContext);
  }

  private tenantId() {
    return this.tenantContext.requireTenantId();
  }

  async create(data: {
    licensePlate: string;
    fipeValue: number | null;
    desiredMarginPercent: number | null;
    estimatedCosts: number | null;
    maxPurchaseValue: number | null;
    rawResponse: Prisma.InputJsonValue;
    userId: string;
  }) {
    return this.prisma.purchaseIntelligenceQuery.create({
      data: {
        tenantId: this.tenantId(),
        licensePlate: data.licensePlate,
        fipeValue: data.fipeValue,
        desiredMarginPercent: data.desiredMarginPercent,
        estimatedCosts: data.estimatedCosts,
        maxPurchaseValue: data.maxPurchaseValue,
        rawResponse: data.rawResponse,
        userId: data.userId,
      },
    });
  }

  async findPaginated(query: ListPurchaseHistoryQueryDto) {
    const { page, limit, skip, orderBy } = resolvePagination(query);
    const where: Prisma.PurchaseIntelligenceQueryWhereInput = {
      tenantId: this.tenantId(),
      ...(query.licensePlate && {
        licensePlate: normalizeLicensePlate(query.licensePlate),
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.purchaseIntelligenceQuery.findMany({
        where,
        skip,
        take: limit,
        orderBy: orderBy ?? { createdAt: 'desc' },
      }),
      this.prisma.purchaseIntelligenceQuery.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}
