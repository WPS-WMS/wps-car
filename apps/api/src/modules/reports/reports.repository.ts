import { Injectable } from '@nestjs/common';
import { Prisma, VehicleStatus } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { TenantContextService } from '../../infrastructure/tenant/tenant-context.service';
import { DashboardsRepository } from '../dashboards/dashboards.repository';
import {
  paymentMethodReportLabels,
  saleStatusReportLabels,
  vehicleStatusReportLabels,
} from '../../common/constants/report-labels';
import { ExportReportQueryDto } from './dto/export-report-query.dto';
import { GeneralReportQueryDto } from './dto/general-report-query.dto';
import type { SalesReportRow, StockReportRow, SummaryReportData } from './types/report-export.types';

const STOCK_STATUSES: VehicleStatus[] = [
  VehicleStatus.IN_STOCK,
  VehicleStatus.RESERVED,
  VehicleStatus.IN_PREPARATION,
  VehicleStatus.IN_MAINTENANCE,
];

const MAX_EXPORT_ROWS = 10_000;

@Injectable()
export class ReportsRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly dashboardsRepository: DashboardsRepository,
  ) {}

  private tenantId() {
    return this.tenantContext.requireTenantId();
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

  async getTenantName() {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: this.tenantId() },
      select: { name: true },
    });
    return tenant?.name ?? 'Revenda';
  }

  async getStockRows(): Promise<StockReportRow[]> {
    const vehicles = await this.prisma.vehicle.findMany({
      where: { tenantId: this.tenantId(), status: { in: STOCK_STATUSES } },
      select: {
        licensePlate: true,
        brand: true,
        model: true,
        version: true,
        modelYear: true,
        status: true,
        financial: {
          select: {
            purchaseValue: true,
            totalCosts: true,
            listedValue: true,
            daysInStock: true,
          },
        },
      },
      orderBy: { brand: 'asc' },
      take: MAX_EXPORT_ROWS,
    });

    return vehicles.map((v) => {
      const purchaseValue = v.financial
        ? Number(v.financial.purchaseValue.toString())
        : 0;
      const totalCosts = v.financial ? Number(v.financial.totalCosts.toString()) : 0;
      const listedValue = v.financial?.listedValue
        ? Number(v.financial.listedValue.toString())
        : null;
      const expectedMargin =
        listedValue !== null ? listedValue - purchaseValue - totalCosts : null;

      return {
        licensePlate: v.licensePlate ?? '—',
        brand: v.brand,
        model: v.model,
        version: v.version ?? '',
        year: v.modelYear,
        purchaseValue,
        totalCosts,
        listedValue,
        expectedMargin,
        daysInStock: v.financial?.daysInStock ?? null,
        status: vehicleStatusReportLabels[v.status] ?? v.status,
      };
    });
  }

  async getSalesRows(
    query: ExportReportQueryDto,
    saleScope: import('@prisma/client').Prisma.SaleWhereInput = {},
  ): Promise<SalesReportRow[]> {
    const endDate = this.normalizeEnd(query.endDate);
    const sales = await this.prisma.sale.findMany({
      where: {
        tenantId: this.tenantId(),
        ...saleScope,
        ...(query.status && { status: query.status }),
        ...(query.startDate || query.endDate
          ? {
              saleDate: {
                ...(query.startDate && { gte: query.startDate }),
                ...(endDate && { lte: endDate }),
              },
            }
          : {}),
      },
      include: {
        vehicle: { select: { brand: true, model: true, licensePlate: true } },
        customer: { select: { name: true } },
        seller: { select: { name: true } },
      },
      orderBy: { saleDate: 'desc' },
      take: MAX_EXPORT_ROWS,
    });

    return sales.map((s) => ({
      saleDate: s.saleDate.toISOString().slice(0, 10),
      vehicle: s.vehicle ? `${s.vehicle.brand} ${s.vehicle.model}` : '—',
      licensePlate: s.vehicle?.licensePlate ?? '—',
      customer: s.customer?.name ?? '—',
      seller: s.seller?.name ?? '—',
      amount: Number(s.amount.toString()),
      paymentMethod: paymentMethodReportLabels[s.paymentMethod] ?? s.paymentMethod,
      status: saleStatusReportLabels[s.status] ?? s.status,
      commission: s.commission ? Number(s.commission.toString()) : null,
    }));
  }

  async getSummaryData(
    startDate?: Date,
    endDate?: Date,
    saleScope: import('@prisma/client').Prisma.SaleWhereInput = {},
  ): Promise<SummaryReportData> {
    const [stock, sales, ranking] = await Promise.all([
      this.dashboardsRepository.getStockMetrics(),
      this.dashboardsRepository.getSalesMetrics(startDate, endDate, saleScope),
      this.dashboardsRepository.getSellerRanking(startDate, endDate, saleScope),
    ]);

    const periodLabel = this.formatPeriodLabel(startDate, endDate);

    return {
      periodLabel,
      stock: {
        totalStock: stock.totalStock,
        totalInvestment: stock.totalInvestment,
        totalCosts: stock.totalCosts,
        totalListedValue: stock.totalListedValue,
      },
      sales: {
        salesCount: sales.salesCount,
        totalRevenue: sales.totalRevenue,
        totalProfit: sales.totalNetProfit,
        averageTicket: sales.averageTicket,
        averageDaysInStock: sales.averageDaysInStock,
        totalCommission: sales.totalCommission,
      },
      ranking: ranking.map((row, index) => ({
        position: index + 1,
        sellerName: row.seller?.name ?? '—',
        salesCount: row.salesCount,
        totalRevenue: row.totalRevenue,
        totalCommission: row.totalCommission,
      })),
    };
  }

  async getGeneralReport(
    query: GeneralReportQueryDto,
    saleScope: Prisma.SaleWhereInput = {},
  ) {
    const tenantId = this.tenantId();
    const endDate = this.normalizeEnd(query.endDate);

    const where: Prisma.SaleWhereInput = {
      tenantId,
      ...saleScope,
      ...(query.status && { status: query.status }),
      ...(query.startDate || endDate
        ? {
            saleDate: {
              ...(query.startDate && { gte: query.startDate }),
              ...(endDate && { lte: endDate }),
            },
          }
        : {}),
      ...(query.vehicleType
        ? { vehicle: { type: query.vehicleType } }
        : {}),
    };

    const sales = await this.prisma.sale.findMany({
      where,
      select: {
        amount: true,
        commission: true,
        vehicle: {
          select: {
            financial: {
              select: {
                purchaseValue: true,
                totalCosts: true,
                commissionValue: true,
              },
            },
          },
        },
      },
    });

    const financialOnly =
      !query.status
        ? await this.prisma.vehicleFinancial.findMany({
            where: {
              tenantId,
              saleValue: { not: null, gt: 0 },
              saleDate: {
                ...(query.startDate && { gte: query.startDate }),
                ...(endDate && { lte: endDate }),
              },
              ...(query.sellerId && { sellerId: query.sellerId }),
              ...(query.vehicleType
                ? { vehicle: { type: query.vehicleType, sales: { none: {} } } }
                : { vehicle: { sales: { none: {} } } }),
            },
            select: {
              saleValue: true,
              purchaseValue: true,
              totalCosts: true,
              commissionValue: true,
            },
          })
        : [];

    let totalRevenue = 0;
    let totalAcquisitionCost = 0;
    let totalOperationalCosts = 0;
    let totalCommission = 0;
    let entryCount = 0;

    const addEntry = (
      revenue: number,
      purchase: number,
      costs: number,
      commission: number,
    ) => {
      totalRevenue += revenue;
      totalAcquisitionCost += purchase;
      totalOperationalCosts += costs;
      totalCommission += commission;
      entryCount += 1;
    };

    for (const sale of sales) {
      const financial = sale.vehicle?.financial;
      const commission =
        sale.commission != null
          ? Number(sale.commission.toString())
          : financial
            ? Number(financial.commissionValue.toString())
            : 0;
      addEntry(
        Number(sale.amount.toString()),
        financial ? Number(financial.purchaseValue.toString()) : 0,
        financial ? Number(financial.totalCosts.toString()) : 0,
        commission,
      );
    }

    for (const financial of financialOnly) {
      addEntry(
        Number(financial.saleValue!.toString()),
        Number(financial.purchaseValue.toString()),
        Number(financial.totalCosts.toString()),
        Number(financial.commissionValue.toString()),
      );
    }

    const round = (v: number, d = 2) => Math.round(v * 10 ** d) / 10 ** d;
    const grossProfit = round(
      totalRevenue - totalAcquisitionCost - totalOperationalCosts,
    );
    const grossMarginPercent =
      totalRevenue > 0 ? round((grossProfit / totalRevenue) * 100, 2) : null;
    const estimatedNetResult = round(grossProfit - totalCommission);

    return {
      salesCount: entryCount,
      totalRevenue: round(totalRevenue).toFixed(2),
      totalAcquisitionCost: round(totalAcquisitionCost).toFixed(2),
      totalOperationalCosts: round(totalOperationalCosts).toFixed(2),
      grossProfit: grossProfit.toFixed(2),
      grossMarginPercent:
        grossMarginPercent !== null ? grossMarginPercent.toFixed(2) : null,
      totalCommission: round(totalCommission).toFixed(2),
      estimatedNetResult: estimatedNetResult.toFixed(2),
    };
  }

  private formatPeriodLabel(startDate?: Date, endDate?: Date) {
    const fmt = (d: Date) => d.toLocaleDateString('pt-BR');
    if (startDate && endDate) return `${fmt(startDate)} a ${fmt(endDate)}`;
    if (startDate) return `A partir de ${fmt(startDate)}`;
    if (endDate) return `Até ${fmt(endDate)}`;
    return 'Todo o período';
  }
}
