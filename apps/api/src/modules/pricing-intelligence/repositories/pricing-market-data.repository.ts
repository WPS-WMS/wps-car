import { Injectable } from '@nestjs/common';
import { Prisma, VehicleStatus } from '@prisma/client';
import { TenantScopedRepository } from '../../../application/repositories/tenant-scoped.repository';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { TenantContextService } from '../../../infrastructure/tenant/tenant-context.service';

export type SimilarVehicleFilters = {
  brand: string;
  model: string;
  modelYear: number;
  excludeVehicleId?: string;
};

@Injectable()
export class PricingMarketDataRepository extends TenantScopedRepository {
  constructor(
    tenantContext: TenantContextService,
    private readonly prisma: PrismaService,
  ) {
    super(tenantContext);
  }

  private tenantId() {
    return this.tenantContext.requireTenantId();
  }

  private similarWhere(filters: SimilarVehicleFilters): Prisma.VehicleWhereInput {
    return {
      tenantId: this.tenantId(),
      ...(filters.excludeVehicleId && { id: { not: filters.excludeVehicleId } }),
      brand: { equals: filters.brand, mode: 'insensitive' },
      model: { equals: filters.model, mode: 'insensitive' },
      modelYear: { gte: filters.modelYear - 1, lte: filters.modelYear + 1 },
    };
  }

  async getSimilarSoldStats(filters: SimilarVehicleFilters) {
    const vehicles = await this.prisma.vehicle.findMany({
      where: {
        ...this.similarWhere(filters),
        status: VehicleStatus.SOLD,
        financial: { saleValue: { not: null } },
      },
      select: {
        financial: {
          select: {
            saleValue: true,
            daysInStock: true,
          },
        },
      },
      take: 50,
      orderBy: { updatedAt: 'desc' },
    });

    const saleValues = vehicles
      .map((row) => (row.financial?.saleValue ? Number(row.financial.saleValue.toString()) : null))
      .filter((value): value is number => value !== null && value > 0);

    const days = vehicles
      .map((row) => row.financial?.daysInStock)
      .filter((value): value is number => value !== null && value !== undefined && value >= 0);

    return {
      count: saleValues.length,
      averageSalePrice:
        saleValues.length > 0
          ? saleValues.reduce((sum, value) => sum + value, 0) / saleValues.length
          : null,
      averageDaysToSell:
        days.length > 0 ? days.reduce((sum, value) => sum + value, 0) / days.length : null,
    };
  }

  async getSimilarStockStats(filters: SimilarVehicleFilters) {
    const vehicles = await this.prisma.vehicle.findMany({
      where: {
        ...this.similarWhere(filters),
        status: { in: [VehicleStatus.IN_STOCK, VehicleStatus.RESERVED, VehicleStatus.IN_PREPARATION] },
        financial: { listedValue: { not: null } },
      },
      select: {
        financial: {
          select: {
            listedValue: true,
            daysInStock: true,
          },
        },
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    const listedValues = vehicles
      .map((row) =>
        row.financial?.listedValue ? Number(row.financial.listedValue.toString()) : null,
      )
      .filter((value): value is number => value !== null && value > 0);

    return {
      count: listedValues.length,
      averageListedPrice:
        listedValues.length > 0
          ? listedValues.reduce((sum, value) => sum + value, 0) / listedValues.length
          : null,
    };
  }

  async getTenantAverageDaysToSell() {
    const aggregate = await this.prisma.vehicleFinancial.aggregate({
      where: {
        tenantId: this.tenantId(),
        saleDate: { not: null },
        daysInStock: { not: null },
      },
      _avg: { daysInStock: true },
    });

    return aggregate._avg.daysInStock ?? null;
  }
}
