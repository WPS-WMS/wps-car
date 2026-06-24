import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TenantScopedRepository } from '../../../application/repositories/tenant-scoped.repository';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { TenantContextService } from '../../../infrastructure/tenant/tenant-context.service';
import { resolvePagination } from '../../../common/utils/pagination.util';
import { ListPricingHistoryQueryDto } from '../dto/list-pricing-history-query.dto';

@Injectable()
export class PricingIntelligenceRepository extends TenantScopedRepository {
  constructor(
    tenantContext: TenantContextService,
    private readonly prisma: PrismaService,
  ) {
    super(tenantContext);
  }

  private tenantId() {
    return this.tenantContext.requireTenantId();
  }

  create(data: {
    vehicleId: string;
    userId: string;
    fipeValue: number | null;
    marketReference: number;
    minMarginPercent: number;
    conservativePrice: number;
    competitivePrice: number;
    aggressivePrice: number;
    idealListingPrice: number;
    minimumRecommended: number;
    rawResponse: Prisma.InputJsonValue;
  }) {
    return this.prisma.pricingIntelligenceQuery.create({
      data: {
        tenantId: this.tenantId(),
        vehicleId: data.vehicleId,
        userId: data.userId,
        fipeValue: data.fipeValue,
        marketReference: data.marketReference,
        minMarginPercent: data.minMarginPercent,
        conservativePrice: data.conservativePrice,
        competitivePrice: data.competitivePrice,
        aggressivePrice: data.aggressivePrice,
        idealListingPrice: data.idealListingPrice,
        minimumRecommended: data.minimumRecommended,
        rawResponse: data.rawResponse,
      },
    });
  }

  async findPaginated(query: ListPricingHistoryQueryDto) {
    const { page, limit, skip, orderBy } = resolvePagination(query);
    const where: Prisma.PricingIntelligenceQueryWhereInput = {
      tenantId: this.tenantId(),
      ...(query.vehicleId && { vehicleId: query.vehicleId }),
    };

    const [data, total] = await Promise.all([
      this.prisma.pricingIntelligenceQuery.findMany({
        where,
        skip,
        take: limit,
        orderBy: orderBy ?? { createdAt: 'desc' },
      }),
      this.prisma.pricingIntelligenceQuery.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}
