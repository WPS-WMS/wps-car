import { Injectable } from '@nestjs/common';
import { Prisma, VehicleStatus } from '@prisma/client';
import { TenantScopedRepository } from '../../../application/repositories/tenant-scoped.repository';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { TenantContextService } from '../../../infrastructure/tenant/tenant-context.service';
import { resolvePagination } from '../../../common/utils/pagination.util';
import { normalizeLicensePlate } from '../../../common/utils/license-plate.util';
import { ListVehiclesQueryDto } from '../dto/list-vehicles-query.dto';

const vehicleListInclude = {
  photos: {
    orderBy: [{ isPrimary: 'desc' as const }, { sortOrder: 'asc' as const }],
    take: 1,
  },
  financial: true,
  branch: { select: { id: true, name: true } },
} satisfies Prisma.VehicleInclude;

const vehicleInclude = {
  photos: { orderBy: { sortOrder: 'asc' as const } },
  financial: true,
  branch: { select: { id: true, name: true } },
} satisfies Prisma.VehicleInclude;

const vehicleLookupInclude = {
  photos: { orderBy: { sortOrder: 'asc' as const } },
  financial: {
    include: {
      supplier: { select: { id: true, name: true } },
      customer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true, email: true } },
    },
  },
  branch: { select: { id: true, name: true } },
} satisfies Prisma.VehicleInclude;

const listOrderBy: Prisma.VehicleOrderByWithRelationInput[] = [
  { branch: { name: 'asc' } },
  { brand: 'asc' },
  { model: 'asc' },
  { createdAt: 'desc' },
];

@Injectable()
export class VehiclesRepository extends TenantScopedRepository {
  constructor(
    tenantContext: TenantContextService,
    private readonly prisma: PrismaService,
  ) {
    super(tenantContext);
  }

  private tenantId() {
    return this.tenantContext.requireTenantId();
  }

  private buildWhere(
    query: ListVehiclesQueryDto,
    scope: Prisma.VehicleWhereInput = {},
  ): Prisma.VehicleWhereInput {
    const tenantId = this.tenantId();

    return {
      tenantId,
      ...scope,
      ...(query.status && { status: query.status }),
      ...(query.type && { type: query.type }),
      ...(query.brand && {
        brand: { contains: query.brand, mode: 'insensitive' },
      }),
      ...(query.licensePlate && {
        licensePlate: normalizeLicensePlate(query.licensePlate),
      }),
      ...(query.search && {
        // Índices GIN pg_trgm (migration 20260617120000) aceleram ILIKE %term%
        OR: [
          { brand: { contains: query.search, mode: 'insensitive' } },
          { model: { contains: query.search, mode: 'insensitive' } },
          { version: { contains: query.search, mode: 'insensitive' } },
          { licensePlate: { contains: normalizeLicensePlate(query.search) } },
        ],
      }),
    };
  }

  async findManyPaginated(
    query: ListVehiclesQueryDto,
    scope: Prisma.VehicleWhereInput = {},
  ) {
    const { page, limit, skip, orderBy } = resolvePagination(query);
    const where = this.buildWhere(query, scope);

    const [data, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where,
        skip,
        take: limit,
        orderBy: orderBy ?? listOrderBy,
        include: vehicleListInclude,
      }),
      this.prisma.vehicle.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findById(id: string) {
    return this.prisma.vehicle.findFirst({
      where: { id, tenantId: this.tenantId() },
      include: vehicleInclude,
    });
  }

  async findByLicensePlate(licensePlate: string, detailed = false) {
    return this.prisma.vehicle.findFirst({
      where: {
        tenantId: this.tenantId(),
        licensePlate: normalizeLicensePlate(licensePlate),
      },
      include: detailed ? vehicleLookupInclude : vehicleListInclude,
    });
  }

  async findByChassis(chassis: string, excludeId?: string) {
    return this.prisma.vehicle.findFirst({
      where: {
        tenantId: this.tenantId(),
        chassis,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });
  }

  async createWithFinancial(
    vehicleData: Prisma.VehicleUncheckedCreateInput,
    financialData: Omit<Prisma.VehicleFinancialUncheckedCreateInput, 'vehicleId' | 'tenantId'>,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.create({
        data: vehicleData,
        include: vehicleInclude,
      });

      await tx.vehicleFinancial.create({
        data: {
          ...financialData,
          tenantId: vehicle.tenantId,
          vehicleId: vehicle.id,
        },
      });

      await tx.stockMovement.create({
        data: {
          tenantId: vehicle.tenantId,
          vehicleId: vehicle.id,
          type: 'ENTRY',
          description: 'Entrada inicial no estoque',
          userId: vehicle.createdById,
        },
      });

      return tx.vehicle.findUniqueOrThrow({
        where: { id: vehicle.id },
        include: vehicleInclude,
      });
    });
  }

  async update(id: string, data: Prisma.VehicleUncheckedUpdateInput) {
    return this.prisma.vehicle.update({
      where: { id },
      data,
      include: vehicleInclude,
    });
  }

  async updateFinancial(vehicleId: string, data: Prisma.VehicleFinancialUncheckedUpdateInput) {
    return this.prisma.vehicleFinancial.update({
      where: { vehicleId },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.vehicle.delete({ where: { id } });
  }

  async findStockPaginated(
    query: ListVehiclesQueryDto,
    stockStatuses?: VehicleStatus[],
    scope: Prisma.VehicleWhereInput = {},
  ) {
    const stockQuery = {
      ...query,
      status: query.status,
    };

    const { page, limit, skip, orderBy } = resolvePagination(stockQuery);
    const where: Prisma.VehicleWhereInput = {
      ...this.buildWhere(stockQuery, scope),
      ...(stockStatuses &&
        !query.status && {
          status: { in: stockStatuses },
        }),
    };

    const [data, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where,
        skip,
        take: limit,
        orderBy: orderBy ?? listOrderBy,
        include: vehicleListInclude,
      }),
      this.prisma.vehicle.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}
