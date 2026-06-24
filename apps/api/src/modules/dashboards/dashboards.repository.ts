import { Injectable } from '@nestjs/common';
import { Prisma, SaleStatus, VehicleStatus } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { TenantContextService } from '../../infrastructure/tenant/tenant-context.service';

const STOCK_STATUSES: VehicleStatus[] = [
  VehicleStatus.IN_STOCK,
  VehicleStatus.RESERVED,
  VehicleStatus.IN_PREPARATION,
  VehicleStatus.IN_MAINTENANCE,
];

const SOLD_SALE_STATUSES: SaleStatus[] = [SaleStatus.SOLD, SaleStatus.COMPLETED];

@Injectable()
export class DashboardsRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  private tenantId() {
    return this.tenantContext.requireTenantId();
  }

  private normalizeStart(date?: Date) {
    return date;
  }

  private normalizeEnd(date?: Date) {
    if (!date) return undefined;
    if (
      date.getHours() === 0 &&
      date.getMinutes() === 0 &&
      date.getSeconds() === 0 &&
      date.getMilliseconds() === 0
    ) {
      return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        23,
        59,
        59,
        999,
      );
    }
    return date;
  }

  private saleDateFilter(startDate?: Date, endDate?: Date) {
    if (!startDate && !endDate) return undefined;
    const start = this.normalizeStart(startDate);
    const end = this.normalizeEnd(endDate);
    return {
      ...(start && { gte: start }),
      ...(end && { lte: end }),
    };
  }

  async getStockMetrics() {
    const tenantId = this.tenantId();

    const vehicleWhere = {
      tenantId,
      status: { in: STOCK_STATUSES },
    };

    const [totalStock, aggregates, daysAggregate] = await Promise.all([
      this.prisma.vehicle.count({ where: vehicleWhere }),
      this.prisma.vehicleFinancial.aggregate({
        where: {
          tenantId,
          vehicle: { status: { in: STOCK_STATUSES } },
        },
        _sum: {
          purchaseValue: true,
          totalCosts: true,
          listedValue: true,
        },
      }),
      this.prisma.vehicleFinancial.aggregate({
        where: {
          tenantId,
          vehicle: { status: { in: STOCK_STATUSES } },
          daysInStock: { not: null },
        },
        _avg: { daysInStock: true },
      }),
    ]);

    return {
      totalStock,
      totalInvestment: Number(aggregates._sum.purchaseValue?.toString() ?? 0),
      totalCosts: Number(aggregates._sum.totalCosts?.toString() ?? 0),
      totalListedValue: Number(aggregates._sum.listedValue?.toString() ?? 0),
      averageStockDaysInStock: Math.round(daysAggregate._avg.daysInStock ?? 0),
    };
  }

  async getSalesMetrics(
    startDate?: Date,
    endDate?: Date,
    saleScope: Prisma.SaleWhereInput = {},
  ) {
    const tenantId = this.tenantId();
    const saleDate = this.saleDateFilter(startDate, endDate);

    const where = {
      tenantId,
      status: { in: SOLD_SALE_STATUSES },
      ...saleScope,
      ...(saleDate && { saleDate }),
    };

    const [aggregates, financialAgg] = await Promise.all([
      this.prisma.sale.aggregate({
        where,
        _sum: { amount: true, commission: true },
        _count: true,
        _avg: { amount: true },
      }),
      this.prisma.vehicleFinancial.aggregate({
        where: {
          tenantId,
          grossProfit: { not: null },
          ...(saleDate && { saleDate }),
          ...(typeof saleScope.sellerId === 'string'
            ? { sellerId: saleScope.sellerId }
            : {}),
        },
        _sum: { grossProfit: true, netResult: true },
        _avg: { marginPercent: true, daysInStock: true },
      }),
    ]);

    const totalRevenue = Number(aggregates._sum.amount?.toString() ?? 0);
    const totalGrossProfit = Number(financialAgg._sum.grossProfit?.toString() ?? 0);
    const totalNetProfit = Number(financialAgg._sum.netResult?.toString() ?? 0);

    const averageMarginPercent =
      financialAgg._avg.marginPercent !== null
        ? Number(financialAgg._avg.marginPercent.toString())
        : totalRevenue > 0
          ? (totalGrossProfit / totalRevenue) * 100
          : 0;

    return {
      salesCount: aggregates._count,
      totalRevenue,
      totalCommission: Number(aggregates._sum.commission?.toString() ?? 0),
      averageTicket: Number(aggregates._avg.amount?.toString() ?? 0),
      totalGrossProfit,
      totalNetProfit,
      averageMarginPercent,
      averageDaysInStock: Math.round(financialAgg._avg.daysInStock ?? 0),
    };
  }

  async getSellerRanking(
    startDate?: Date,
    endDate?: Date,
    saleScope: Prisma.SaleWhereInput = {},
  ) {
    const tenantId = this.tenantId();
    const saleDate = this.saleDateFilter(startDate, endDate);
    const periodWhere = {
      tenantId,
      ...saleScope,
      ...(saleDate && { saleDate }),
    };

    const [finalizedBySeller, allBySeller, financialBySeller] = await Promise.all([
      this.prisma.sale.groupBy({
        by: ['sellerId'],
        where: {
          ...periodWhere,
          status: { in: SOLD_SALE_STATUSES },
        },
        _count: true,
        _sum: { amount: true, commission: true },
      }),
      this.prisma.sale.groupBy({
        by: ['sellerId'],
        where: periodWhere,
        _count: true,
      }),
      this.prisma.vehicleFinancial.groupBy({
        by: ['sellerId'],
        where: {
          tenantId,
          sellerId: { not: null },
          grossProfit: { not: null },
          ...(saleDate && { saleDate }),
          ...(typeof saleScope.sellerId === 'string'
            ? { sellerId: saleScope.sellerId }
            : {}),
        },
        _sum: { grossProfit: true, netResult: true },
        _avg: { marginPercent: true },
      }),
    ]);

    const negotiationsMap = new Map(
      allBySeller.map((r) => [r.sellerId, r._count]),
    );

    const financialMap = new Map(
      financialBySeller
        .filter((row) => row.sellerId)
        .map((row) => [row.sellerId as string, row]),
    );

    const sellerIds = finalizedBySeller.map((row) => row.sellerId);
    const sellers = await this.prisma.user.findMany({
      where: { id: { in: sellerIds } },
      select: { id: true, name: true, email: true },
    });
    const sellerMap = new Map(sellers.map((s) => [s.id, s]));

    return finalizedBySeller
      .map((row) => {
        const negotiations = negotiationsMap.get(row.sellerId) ?? 0;
        const financial = financialMap.get(row.sellerId);
        const totalRevenue = Number(row._sum.amount?.toString() ?? 0);
        const totalGrossProfit = Number(financial?._sum.grossProfit?.toString() ?? 0);
        const totalNetProfit = Number(financial?._sum.netResult?.toString() ?? 0);
        const averageMarginPercent =
          financial?._avg.marginPercent !== null &&
          financial?._avg.marginPercent !== undefined
            ? Number(financial._avg.marginPercent.toString())
            : totalRevenue > 0
              ? (totalGrossProfit / totalRevenue) * 100
              : 0;
        const conversionRate =
          negotiations > 0
            ? Math.round((row._count / negotiations) * 10000) / 100
            : 0;

        return {
          seller: sellerMap.get(row.sellerId),
          salesCount: row._count,
          totalRevenue,
          totalGrossProfit,
          totalNetProfit,
          totalCommission: Number(row._sum.commission?.toString() ?? 0),
          averageMarginPercent,
          conversionRate,
          totalNegotiations: negotiations,
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  async getSellerMetrics(sellerId: string, startDate?: Date, endDate?: Date) {
    const tenantId = this.tenantId();
    const saleDate = this.saleDateFilter(startDate, endDate);

    const [finalized, totalNegotiations] = await Promise.all([
      this.prisma.sale.count({
        where: {
          tenantId,
          sellerId,
          status: { in: SOLD_SALE_STATUSES },
          ...(saleDate && { saleDate }),
        },
      }),
      this.prisma.sale.count({
        where: {
          tenantId,
          sellerId,
          ...(saleDate && { saleDate }),
        },
      }),
    ]);

    const salesAgg = await this.prisma.sale.aggregate({
      where: {
        tenantId,
        sellerId,
        status: { in: SOLD_SALE_STATUSES },
        ...(saleDate && { saleDate }),
      },
      _sum: { amount: true, commission: true },
    });

    const conversionRate =
      totalNegotiations > 0
        ? Math.round((finalized / totalNegotiations) * 10000) / 100
        : 0;

    return {
      vehiclesSold: finalized,
      totalSales: totalNegotiations,
      conversionRate,
      totalRevenue: Number(salesAgg._sum.amount?.toString() ?? 0),
      totalCommission: Number(salesAgg._sum.commission?.toString() ?? 0),
    };
  }
}
