import { Injectable } from '@nestjs/common';
import { SaleStatus, VehicleStatus } from '@prisma/client';
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

    const vehicles = await this.prisma.vehicle.findMany({
      where: { tenantId, status: { in: STOCK_STATUSES } },
      include: { financial: true },
    });

    let totalInvestment = 0;
    let totalCosts = 0;
    let totalListed = 0;
    const stockDays: number[] = [];

    for (const v of vehicles) {
      if (v.financial) {
        totalInvestment += Number(v.financial.purchaseValue.toString());
        totalCosts += Number(v.financial.totalCosts.toString());
        if (v.financial.listedValue) {
          totalListed += Number(v.financial.listedValue.toString());
        }
        if (v.financial.daysInStock !== null) {
          stockDays.push(v.financial.daysInStock);
        }
      }
    }

    const averageStockDaysInStock =
      stockDays.length > 0
        ? Math.round(stockDays.reduce((a, b) => a + b, 0) / stockDays.length)
        : 0;

    return {
      totalStock: vehicles.length,
      totalInvestment,
      totalCosts,
      totalListedValue: totalListed,
      averageStockDaysInStock,
    };
  }

  async getSalesMetrics(startDate?: Date, endDate?: Date) {
    const tenantId = this.tenantId();
    const saleDate = this.saleDateFilter(startDate, endDate);

    const where = {
      tenantId,
      status: { in: SOLD_SALE_STATUSES },
      ...(saleDate && { saleDate }),
    };

    const [aggregates, financials] = await Promise.all([
      this.prisma.sale.aggregate({
        where,
        _sum: { amount: true, commission: true },
        _count: true,
        _avg: { amount: true },
      }),
      this.prisma.vehicleFinancial.findMany({
        where: {
          tenantId,
          saleDate: saleDate ?? undefined,
          grossProfit: { not: null },
        },
        select: {
          grossProfit: true,
          netResult: true,
          marginPercent: true,
          daysInStock: true,
        },
      }),
    ]);

    const totalRevenue = Number(aggregates._sum.amount?.toString() ?? 0);
    const totalGrossProfit = financials.reduce(
      (sum, f) => sum + Number(f.grossProfit?.toString() ?? 0),
      0,
    );
    const totalNetProfit = financials.reduce(
      (sum, f) => sum + Number(f.netResult?.toString() ?? 0),
      0,
    );

    const marginPercents = financials
      .map((f) =>
        f.marginPercent !== null ? Number(f.marginPercent.toString()) : null,
      )
      .filter((m): m is number => m !== null);

    const averageMarginPercent =
      marginPercents.length > 0
        ? marginPercents.reduce((a, b) => a + b, 0) / marginPercents.length
        : totalRevenue > 0
          ? (totalGrossProfit / totalRevenue) * 100
          : 0;

    const daysValues = financials
      .map((f) => f.daysInStock)
      .filter((d): d is number => d !== null);

    const avgDaysInStock =
      daysValues.length > 0
        ? daysValues.reduce((a, b) => a + b, 0) / daysValues.length
        : 0;

    return {
      salesCount: aggregates._count,
      totalRevenue,
      totalCommission: Number(aggregates._sum.commission?.toString() ?? 0),
      averageTicket: Number(aggregates._avg.amount?.toString() ?? 0),
      totalGrossProfit,
      totalNetProfit,
      averageMarginPercent,
      averageDaysInStock: Math.round(avgDaysInStock),
    };
  }

  async getSellerRanking(startDate?: Date, endDate?: Date) {
    const tenantId = this.tenantId();
    const saleDate = this.saleDateFilter(startDate, endDate);
    const periodWhere = {
      tenantId,
      ...(saleDate && { saleDate }),
    };

    const [finalizedSales, allBySeller] = await Promise.all([
      this.prisma.sale.findMany({
        where: {
          ...periodWhere,
          status: { in: SOLD_SALE_STATUSES },
        },
        select: {
          sellerId: true,
          amount: true,
          commission: true,
          vehicle: {
            select: {
              financial: {
                select: { grossProfit: true, netResult: true, marginPercent: true },
              },
            },
          },
        },
      }),
      this.prisma.sale.groupBy({
        by: ['sellerId'],
        where: periodWhere,
        _count: true,
      }),
    ]);

    const negotiationsMap = new Map(
      allBySeller.map((r) => [r.sellerId, r._count]),
    );

    type Row = {
      sellerId: string;
      salesCount: number;
      totalRevenue: number;
      totalGrossProfit: number;
      totalNetProfit: number;
      totalCommission: number;
      marginPercents: number[];
    };

    const bySeller = new Map<string, Row>();

    for (const sale of finalizedSales) {
      let row = bySeller.get(sale.sellerId);
      if (!row) {
        row = {
          sellerId: sale.sellerId,
          salesCount: 0,
          totalRevenue: 0,
          totalGrossProfit: 0,
          totalNetProfit: 0,
          totalCommission: 0,
          marginPercents: [],
        };
        bySeller.set(sale.sellerId, row);
      }

      row.salesCount += 1;
      row.totalRevenue += Number(sale.amount.toString());
      row.totalCommission += Number(sale.commission?.toString() ?? 0);

      const fin = sale.vehicle?.financial;
      if (fin?.grossProfit) {
        row.totalGrossProfit += Number(fin.grossProfit.toString());
      }
      if (fin?.netResult) {
        row.totalNetProfit += Number(fin.netResult.toString());
      }
      if (fin?.marginPercent) {
        row.marginPercents.push(Number(fin.marginPercent.toString()));
      }
    }

    const sellerIds = [...bySeller.keys()];
    const sellers = await this.prisma.user.findMany({
      where: { id: { in: sellerIds } },
      select: { id: true, name: true, email: true },
    });
    const sellerMap = new Map(sellers.map((s) => [s.id, s]));

    return [...bySeller.values()]
      .map((r) => {
        const negotiations = negotiationsMap.get(r.sellerId) ?? 0;
        const averageMarginPercent =
          r.marginPercents.length > 0
            ? r.marginPercents.reduce((a, b) => a + b, 0) / r.marginPercents.length
            : r.totalRevenue > 0
              ? (r.totalGrossProfit / r.totalRevenue) * 100
              : 0;
        const conversionRate =
          negotiations > 0
            ? Math.round((r.salesCount / negotiations) * 10000) / 100
            : 0;

        return {
          seller: sellerMap.get(r.sellerId),
          salesCount: r.salesCount,
          totalRevenue: r.totalRevenue,
          totalGrossProfit: r.totalGrossProfit,
          totalNetProfit: r.totalNetProfit,
          totalCommission: r.totalCommission,
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
