import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TenantScopedRepository } from '../../../application/repositories/tenant-scoped.repository';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { TenantContextService } from '../../../infrastructure/tenant/tenant-context.service';
import { resolvePagination } from '../../../common/utils/pagination.util';
import { ListSuppliersQueryDto } from '../dto/list-suppliers-query.dto';

@Injectable()
export class SuppliersRepository extends TenantScopedRepository {
  constructor(
    tenantContext: TenantContextService,
    private readonly prisma: PrismaService,
  ) {
    super(tenantContext);
  }

  private tenantId() {
    return this.tenantContext.requireTenantId();
  }

  private buildWhere(query: ListSuppliersQueryDto): Prisma.SupplierWhereInput {
    return {
      tenantId: this.tenantId(),
      ...(query.category && { category: query.category }),
      ...(query.active !== undefined && { active: query.active }),
      ...(query.search && {
        // Índices GIN pg_trgm (migration 20260618130000) aceleram ILIKE %term%
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { document: { contains: query.search.replace(/\D/g, '') } },
          { email: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };
  }

  async findManyPaginated(query: ListSuppliersQueryDto) {
    const { page, limit, skip, orderBy } = resolvePagination(query);
    const where = this.buildWhere(query);

    const [data, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: orderBy ?? { name: 'asc' },
      }),
      this.prisma.supplier.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findById(id: string) {
    return this.prisma.supplier.findFirst({
      where: { id, tenantId: this.tenantId() },
    });
  }

  async findPurchasesBySupplier(supplierId: string, tenantId: string) {
    const rows = await this.prisma.vehicleFinancial.findMany({
      where: { tenantId, supplierId },
      orderBy: { purchaseDate: 'desc' },
      include: {
        vehicle: {
          select: {
            id: true,
            brand: true,
            model: true,
            licensePlate: true,
            status: true,
            modelYear: true,
          },
        },
      },
    });

    return rows.map((row) => ({
      vehicleId: row.vehicleId,
      brand: row.vehicle.brand,
      model: row.vehicle.model,
      licensePlate: row.vehicle.licensePlate,
      status: row.vehicle.status,
      modelYear: row.vehicle.modelYear,
      purchaseValue: row.purchaseValue.toString(),
      purchaseDate: row.purchaseDate,
    }));
  }

  async findByDocument(document: string) {
    return this.prisma.supplier.findFirst({
      where: { tenantId: this.tenantId(), document },
    });
  }

  async create(data: Prisma.SupplierUncheckedCreateInput) {
    return this.prisma.$transaction(async (tx) => {
      const supplier = await tx.supplier.create({ data });

      await tx.supplierHistory.create({
        data: {
          tenantId: supplier.tenantId,
          supplierId: supplier.id,
          action: 'CREATED',
          userId: data.createdById,
          details: { name: supplier.name, document: supplier.document, category: supplier.category },
        },
      });

      return supplier;
    });
  }

  async update(id: string, data: Prisma.SupplierUncheckedUpdateInput, actorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const supplier = await tx.supplier.update({ where: { id }, data });

      await tx.supplierHistory.create({
        data: {
          tenantId: supplier.tenantId,
          supplierId: supplier.id,
          action: data.active === false ? 'DEACTIVATED' : 'UPDATED',
          userId: actorId,
          details: { fields: Object.keys(data).filter((k) => k !== 'updatedById') },
        },
      });

      return supplier;
    });
  }

  async findHistory(supplierId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where = { supplierId, tenantId: this.tenantId() };

    const [data, total] = await Promise.all([
      this.prisma.supplierHistory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.supplierHistory.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async addHistoryNote(
    supplierId: string,
    tenantId: string,
    note: string,
    userId: string,
  ) {
    return this.prisma.supplierHistory.create({
      data: {
        tenantId,
        supplierId,
        action: 'NOTE',
        userId,
        details: { note },
      },
    });
  }
}
