import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { resolvePagination } from '../../common/utils/pagination.util';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { toTenantResponse } from '../../common/mappers/tenant.mapper';
import { PlatformMetricsQueryDto } from './dto/platform-metrics-query.dto';
import {
  PlatformRepository,
  TenantUsageSnapshot,
} from './platform.repository';

const METRICS_CACHE_TTL_MS = 10 * 60 * 1000;

type SerializedUsage = Omit<TenantUsageSnapshot, 'revenueInPeriod'> & {
  revenueInPeriod: string;
};

type CachedPlatformSnapshot = {
  tenantCount: number;
  usageEntries: Array<[string, SerializedUsage]>;
  cachedAt: string;
};

function currentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function monthCacheKey(date: Date) {
  return `platform:usage:${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function serializeUsage(map: Map<string, TenantUsageSnapshot>): Array<[string, SerializedUsage]> {
  return Array.from(map.entries()).map(([tenantId, usage]) => [
    tenantId,
    {
      ...usage,
      revenueInPeriod: usage.revenueInPeriod.toFixed(2),
    },
  ]);
}

function deserializeUsage(entries: Array<[string, SerializedUsage]>) {
  const map = new Map<string, TenantUsageSnapshot>();
  for (const [tenantId, usage] of entries) {
    map.set(tenantId, {
      ...usage,
      revenueInPeriod: new Prisma.Decimal(usage.revenueInPeriod),
    });
  }
  return map;
}

function mapUsage(usageByTenant: Map<string, TenantUsageSnapshot>, tenantId: string) {
  const usage = usageByTenant.get(tenantId);

  return {
    activeUsers: usage?.activeUsers ?? 0,
    totalUsers: usage?.totalUsers ?? 0,
    branches: usage?.branches ?? 0,
    vehicles: usage?.vehicles ?? 0,
    stockVehicles: usage?.stockVehicles ?? 0,
    customers: usage?.customers ?? 0,
    salesInPeriod: usage?.salesInPeriod ?? 0,
    revenueInPeriod: usage?.revenueInPeriod.toFixed(2) ?? '0.00',
  };
}

@Injectable()
export class PlatformService {
  constructor(
    private readonly repository: PlatformRepository,
    private readonly cache: CacheService,
  ) {}

  async getMetrics(query: PlatformMetricsQueryDto) {
    const { page, limit, skip } = resolvePagination(query);
    const period = currentMonthRange();
    const cacheKey = monthCacheKey(period.start);

    let snapshot = await this.cache.get<CachedPlatformSnapshot>(cacheKey);
    if (!snapshot) {
      const [tenantCount, usageByTenant] = await Promise.all([
        this.repository.countTenants(),
        this.repository.getAllTenantsUsage(period),
      ]);

      snapshot = {
        tenantCount,
        usageEntries: serializeUsage(usageByTenant),
        cachedAt: new Date().toISOString(),
      };
      await this.cache.set(cacheKey, snapshot, METRICS_CACHE_TTL_MS);
    }

    const usageByTenant = deserializeUsage(snapshot.usageEntries);
    const tenantsPage = await this.repository.findTenantsPaginated(skip, limit);

    const tenantMetrics = tenantsPage.map((tenant) => ({
      tenant: toTenantResponse(tenant),
      usage: mapUsage(usageByTenant, tenant.id),
    }));

    const totals = Array.from(usageByTenant.values()).reduce(
      (acc, usage) => ({
        activeUsers: acc.activeUsers + usage.activeUsers,
        totalUsers: acc.totalUsers + usage.totalUsers,
        branches: acc.branches + usage.branches,
        vehicles: acc.vehicles + usage.vehicles,
        stockVehicles: acc.stockVehicles + usage.stockVehicles,
        customers: acc.customers + usage.customers,
        salesInPeriod: acc.salesInPeriod + usage.salesInPeriod,
        revenueInPeriod: acc.revenueInPeriod + Number(usage.revenueInPeriod),
      }),
      {
        activeUsers: 0,
        totalUsers: 0,
        branches: 0,
        vehicles: 0,
        stockVehicles: 0,
        customers: 0,
        salesInPeriod: 0,
        revenueInPeriod: 0,
      },
    );

    const paginated = new PaginatedResponseDto(
      tenantMetrics,
      snapshot.tenantCount,
      page,
      limit,
    );

    return {
      period: {
        startDate: period.start.toISOString(),
        endDate: period.end.toISOString(),
        label: 'Mês atual',
      },
      tenants: paginated.data,
      totals: {
        ...totals,
        revenueInPeriod: totals.revenueInPeriod.toFixed(2),
        tenantCount: snapshot.tenantCount,
      },
      meta: paginated.meta,
      cachedAt: snapshot.cachedAt,
    };
  }
}
