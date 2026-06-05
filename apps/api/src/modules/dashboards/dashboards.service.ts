import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { DashboardsRepository } from './dashboards.repository';

@Injectable()
export class DashboardsService {
  constructor(private readonly repository: DashboardsRepository) {}

  async getManagerDashboard(query: DashboardQueryDto) {
    const [stock, sales] = await Promise.all([
      this.repository.getStockMetrics(),
      this.repository.getSalesMetrics(query.startDate, query.endDate),
    ]);

    return {
      period: { startDate: query.startDate, endDate: query.endDate },
      stock: {
        totalStock: stock.totalStock,
        totalInvestment: stock.totalInvestment.toFixed(2),
        totalCosts: stock.totalCosts.toFixed(2),
        totalListedValue: stock.totalListedValue.toFixed(2),
        averageStockDaysInStock: stock.averageStockDaysInStock,
      },
      sales: {
        salesCount: sales.salesCount,
        totalRevenue: sales.totalRevenue.toFixed(2),
        totalGrossProfit: sales.totalGrossProfit.toFixed(2),
        totalNetProfit: sales.totalNetProfit.toFixed(2),
        /** @deprecated use totalNetProfit */
        totalProfit: sales.totalNetProfit.toFixed(2),
        averageMarginPercent: sales.averageMarginPercent.toFixed(2),
        averageTicket: sales.averageTicket.toFixed(2),
        averageDaysInStock: sales.averageDaysInStock,
        totalCommission: sales.totalCommission.toFixed(2),
      },
    };
  }

  async getSellerDashboard(actor: AuthenticatedUser, query: DashboardQueryDto) {
    const metrics = await this.repository.getSellerMetrics(
      actor.id,
      query.startDate,
      query.endDate,
    );

    return {
      period: { startDate: query.startDate, endDate: query.endDate },
      seller: { id: actor.id, name: actor.name },
      vehiclesSold: metrics.vehiclesSold,
      totalNegotiations: metrics.totalSales,
      conversionRate: metrics.conversionRate,
      totalRevenue: metrics.totalRevenue.toFixed(2),
      totalCommission: metrics.totalCommission.toFixed(2),
    };
  }

  async getSellerRanking(query: DashboardQueryDto) {
    const ranking = await this.repository.getSellerRanking(
      query.startDate,
      query.endDate,
    );

    return {
      period: { startDate: query.startDate, endDate: query.endDate },
      ranking: ranking.map((r, index) => ({
        position: index + 1,
        seller: r.seller,
        salesCount: r.salesCount,
        totalRevenue: r.totalRevenue.toFixed(2),
        totalGrossProfit: r.totalGrossProfit.toFixed(2),
        totalNetProfit: r.totalNetProfit.toFixed(2),
        totalCommission: r.totalCommission.toFixed(2),
        averageMarginPercent: r.averageMarginPercent.toFixed(2),
        conversionRate: r.conversionRate,
        totalNegotiations: r.totalNegotiations,
      })),
    };
  }

}
