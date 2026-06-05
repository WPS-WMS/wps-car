import { Injectable } from '@nestjs/common';
import { Prisma, StockMovementType } from '@prisma/client';
import { TenantScopedRepository } from '../../../application/repositories/tenant-scoped.repository';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { TenantContextService } from '../../../infrastructure/tenant/tenant-context.service';
import { resolvePagination } from '../../../common/utils/pagination.util';
import { ListStockMovementsQueryDto } from '../dto/list-stock-movements-query.dto';

@Injectable()
export class StockRepository extends TenantScopedRepository {
  constructor(
    tenantContext: TenantContextService,
    private readonly prisma: PrismaService,
  ) {
    super(tenantContext);
  }

  private tenantId() {
    return this.tenantContext.requireTenantId();
  }

  async createMovement(data: {
    vehicleId: string;
    type: StockMovementType;
    description?: string;
    reference?: string;
    userId: string;
  }) {
    return this.prisma.stockMovement.create({
      data: {
        tenantId: this.tenantId(),
        vehicleId: data.vehicleId,
        type: data.type,
        description: data.description,
        reference: data.reference,
        userId: data.userId,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        vehicle: {
          select: {
            id: true,
            brand: true,
            model: true,
            licensePlate: true,
          },
        },
      },
    });
  }

  async findMovementsPaginated(query: ListStockMovementsQueryDto) {
    const { page, limit, skip, orderBy } = resolvePagination(query);
    const tenantId = this.tenantId();

    const where: Prisma.StockMovementWhereInput = {
      tenantId,
      ...(query.vehicleId && { vehicleId: query.vehicleId }),
    };

    const [data, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy: orderBy ?? { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true } },
          vehicle: {
            select: {
              id: true,
              brand: true,
              model: true,
              licensePlate: true,
            },
          },
        },
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}
