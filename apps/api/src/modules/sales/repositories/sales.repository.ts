import { Injectable } from '@nestjs/common';
import { Prisma, SaleStatus, VehicleType } from '@prisma/client';
import { TenantScopedRepository } from '../../../application/repositories/tenant-scoped.repository';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { TenantContextService } from '../../../infrastructure/tenant/tenant-context.service';
import { resolvePagination } from '../../../common/utils/pagination.util';
import { ListSalesQueryDto } from '../dto/list-sales-query.dto';
import { CommissionReportQueryDto } from '../dto/commission-report-query.dto';

const saleInclude = {
  vehicle: {
    select: { id: true, brand: true, model: true, licensePlate: true, status: true },
  },
  customer: { select: { id: true, name: true, document: true, phone: true } },
  seller: { select: { id: true, name: true, email: true } },
} satisfies Prisma.SaleInclude;

const ACTIVE_SALE_STATUSES: SaleStatus[] = [
  SaleStatus.NEGOTIATION,
  SaleStatus.AWAITING_PAYMENT,
  SaleStatus.SOLD,
  SaleStatus.COMPLETED,
];

@Injectable()
export class SalesRepository extends TenantScopedRepository {
  constructor(
    tenantContext: TenantContextService,
    private readonly prisma: PrismaService,
  ) {
    super(tenantContext);
  }

  private tenantId() {
    return this.tenantContext.requireTenantId();
  }

  buildWhere(
    query: ListSalesQueryDto,
    saleScope: Prisma.SaleWhereInput = {},
  ): Prisma.SaleWhereInput {
    return {
      tenantId: this.tenantId(),
      ...saleScope,
      ...(query.status && { status: query.status }),
      ...(query.vehicleId && { vehicleId: query.vehicleId }),
      ...(query.customerId && { customerId: query.customerId }),
      ...(query.startDate || query.endDate
        ? {
            saleDate: {
              ...(query.startDate && { gte: query.startDate }),
              ...(query.endDate && { lte: query.endDate }),
            },
          }
        : {}),
      ...(query.search && {
        OR: [
          { notes: { contains: query.search, mode: 'insensitive' } },
          { customer: { name: { contains: query.search, mode: 'insensitive' } } },
          { vehicle: { licensePlate: { contains: query.search, mode: 'insensitive' } } },
        ],
      }),
    };
  }

  async findManyPaginated(
    query: ListSalesQueryDto,
    saleScope: Prisma.SaleWhereInput = {},
  ) {
    const { page, limit, skip, orderBy } = resolvePagination(query);
    const where = this.buildWhere(query, saleScope);

    const [data, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        skip,
        take: limit,
        orderBy: orderBy ?? { saleDate: 'desc' },
        include: saleInclude,
      }),
      this.prisma.sale.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findById(id: string) {
    return this.prisma.sale.findFirst({
      where: { id, tenantId: this.tenantId() },
      include: saleInclude,
    });
  }

  async findActiveByVehicle(vehicleId: string, excludeSaleId?: string) {
    return this.prisma.sale.findFirst({
      where: {
        vehicleId,
        tenantId: this.tenantId(),
        status: { in: ACTIVE_SALE_STATUSES },
        ...(excludeSaleId && { id: { not: excludeSaleId } }),
      },
    });
  }

  async create(data: Prisma.SaleUncheckedCreateInput) {
    return this.prisma.sale.create({
      data,
      include: saleInclude,
    });
  }

  async update(id: string, data: Prisma.SaleUncheckedUpdateInput) {
    return this.prisma.sale.update({
      where: { id },
      data,
      include: saleInclude,
    });
  }

  async getSellerCommissionSummary(sellerId: string, startDate?: Date, endDate?: Date) {
    const normalizedEnd = this.normalizeEndDate(endDate);
    const where: Prisma.SaleWhereInput = {
      tenantId: this.tenantId(),
      sellerId,
      status: { in: [SaleStatus.SOLD, SaleStatus.COMPLETED] },
      ...(startDate || normalizedEnd
        ? {
            saleDate: {
              ...(startDate && { gte: startDate }),
              ...(normalizedEnd && { lte: normalizedEnd }),
            },
          }
        : {}),
    };

    const [aggregates, count] = await Promise.all([
      this.prisma.sale.aggregate({
        where,
        _sum: { amount: true, commission: true },
        _count: true,
      }),
      this.prisma.sale.count({ where }),
    ]);

    return {
      salesCount: count,
      totalSalesAmount: aggregates._sum.amount?.toString() ?? '0',
      totalCommission: aggregates._sum.commission?.toString() ?? '0',
    };
  }

  private normalizeEndDate(date?: Date) {
    if (!date) return undefined;
    if (
      date.getUTCHours() === 0 &&
      date.getUTCMinutes() === 0 &&
      date.getUTCSeconds() === 0 &&
      date.getUTCMilliseconds() === 0
    ) {
      return new Date(
        Date.UTC(
          date.getUTCFullYear(),
          date.getUTCMonth(),
          date.getUTCDate(),
          23,
          59,
          59,
          999,
        ),
      );
    }
    return date;
  }

  async getCommissionReport(
    query: CommissionReportQueryDto,
    saleScope: Prisma.SaleWhereInput = {},
  ) {
    const endDate = this.normalizeEndDate(query.endDate);
    const where: Prisma.SaleWhereInput = {
      tenantId: this.tenantId(),
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
        ? {
            vehicle: {
              type: query.vehicleType as unknown as VehicleType,
            },
          }
        : {}),
    };

    const sales = await this.prisma.sale.findMany({
      where,
      orderBy: { saleDate: 'desc' },
      include: {
        vehicle: {
          select: {
            id: true,
            brand: true,
            model: true,
            licensePlate: true,
            type: true,
            financial: { select: { netResult: true } },
          },
        },
        seller: { select: { id: true, name: true, email: true } },
      },
    });

    return sales;
  }
}
