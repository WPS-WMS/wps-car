import { Injectable } from '@nestjs/common';
import { Prisma, SaleStatus, VehicleStatus } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

const STOCK_STATUSES: VehicleStatus[] = [
  VehicleStatus.IN_STOCK,
  VehicleStatus.RESERVED,
  VehicleStatus.IN_PREPARATION,
  VehicleStatus.IN_MAINTENANCE,
];

const BILLED_SALE_STATUSES: SaleStatus[] = [SaleStatus.SOLD, SaleStatus.COMPLETED];

export type TenantUsageSnapshot = {
  activeUsers: number;
  totalUsers: number;
  branches: number;
  vehicles: number;
  stockVehicles: number;
  customers: number;
  salesInPeriod: number;
  revenueInPeriod: Prisma.Decimal;
};

@Injectable()
export class PlatformRepository {
  constructor(private readonly prisma: PrismaService) {}

  countTenants() {
    return this.prisma.tenant.count();
  }

  findTenantsPaginated(skip: number, limit: number) {
    return this.prisma.tenant.findMany({
      orderBy: { name: 'asc' },
      skip,
      take: limit,
    });
  }

  async findAllTenants() {
    return this.prisma.tenant.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getAllTenantsUsage(period: { start: Date; end: Date }) {
    const salePeriodWhere = {
      status: { in: BILLED_SALE_STATUSES },
      saleDate: { gte: period.start, lte: period.end },
    };

    const [
      activeUsersByTenant,
      totalUsersByTenant,
      branchesByTenant,
      vehiclesByTenant,
      stockByTenant,
      customersByTenant,
      salesByTenant,
    ] = await Promise.all([
      this.prisma.user.groupBy({
        by: ['tenantId'],
        where: { tenantId: { not: null }, active: true },
        _count: { _all: true },
      }),
      this.prisma.user.groupBy({
        by: ['tenantId'],
        where: { tenantId: { not: null } },
        _count: { _all: true },
      }),
      this.prisma.tenantBranch.groupBy({
        by: ['tenantId'],
        where: { active: true },
        _count: { _all: true },
      }),
      this.prisma.vehicle.groupBy({
        by: ['tenantId'],
        _count: { _all: true },
      }),
      this.prisma.vehicle.groupBy({
        by: ['tenantId'],
        where: { status: { in: STOCK_STATUSES } },
        _count: { _all: true },
      }),
      this.prisma.customer.groupBy({
        by: ['tenantId'],
        _count: { _all: true },
      }),
      this.prisma.sale.groupBy({
        by: ['tenantId'],
        where: salePeriodWhere,
        _count: { _all: true },
        _sum: { amount: true },
      }),
    ]);

    const usageByTenant = new Map<string, TenantUsageSnapshot>();

    const ensure = (tenantId: string): TenantUsageSnapshot => {
      let row = usageByTenant.get(tenantId);
      if (!row) {
        row = {
          activeUsers: 0,
          totalUsers: 0,
          branches: 0,
          vehicles: 0,
          stockVehicles: 0,
          customers: 0,
          salesInPeriod: 0,
          revenueInPeriod: new Prisma.Decimal(0),
        };
        usageByTenant.set(tenantId, row);
      }
      return row;
    };

    for (const row of activeUsersByTenant) {
      if (!row.tenantId) continue;
      ensure(row.tenantId).activeUsers = row._count._all;
    }

    for (const row of totalUsersByTenant) {
      if (!row.tenantId) continue;
      ensure(row.tenantId).totalUsers = row._count._all;
    }

    for (const row of branchesByTenant) {
      ensure(row.tenantId).branches = row._count._all;
    }

    for (const row of vehiclesByTenant) {
      ensure(row.tenantId).vehicles = row._count._all;
    }

    for (const row of stockByTenant) {
      ensure(row.tenantId).stockVehicles = row._count._all;
    }

    for (const row of customersByTenant) {
      ensure(row.tenantId).customers = row._count._all;
    }

    for (const row of salesByTenant) {
      ensure(row.tenantId).salesInPeriod = row._count._all;
      ensure(row.tenantId).revenueInPeriod = row._sum.amount ?? new Prisma.Decimal(0);
    }

    return usageByTenant;
  }

  /** @deprecated Prefer getAllTenantsUsage for platform-wide metrics */
  async getTenantUsage(
    tenantId: string,
    period: { start: Date; end: Date },
  ) {
    const map = await this.getAllTenantsUsage(period);
    return (
      map.get(tenantId) ?? {
        activeUsers: 0,
        totalUsers: 0,
        branches: 0,
        vehicles: 0,
        stockVehicles: 0,
        customers: 0,
        salesInPeriod: 0,
        revenueInPeriod: new Prisma.Decimal(0),
      }
    );
  }
}
