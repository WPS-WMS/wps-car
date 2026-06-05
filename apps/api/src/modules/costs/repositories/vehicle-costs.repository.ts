import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TenantScopedRepository } from '../../../application/repositories/tenant-scoped.repository';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { TenantContextService } from '../../../infrastructure/tenant/tenant-context.service';
import { resolvePagination } from '../../../common/utils/pagination.util';
import { ListVehicleCostsQueryDto } from '../dto/list-vehicle-costs-query.dto';

const costInclude = {
  supplier: { select: { id: true, name: true } },
  responsible: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
} satisfies Prisma.VehicleCostInclude;

@Injectable()
export class VehicleCostsRepository extends TenantScopedRepository {
  constructor(
    tenantContext: TenantContextService,
    private readonly prisma: PrismaService,
  ) {
    super(tenantContext);
  }

  private tenantId() {
    return this.tenantContext.requireTenantId();
  }

  async findManyByVehicle(vehicleId: string, query: ListVehicleCostsQueryDto) {
    const { page, limit, skip, orderBy } = resolvePagination(query);

    const where: Prisma.VehicleCostWhereInput = {
      vehicleId,
      tenantId: this.tenantId(),
      ...(query.type && { type: query.type }),
    };

    const [data, total] = await Promise.all([
      this.prisma.vehicleCost.findMany({
        where,
        skip,
        take: limit,
        orderBy: orderBy ?? { costDate: 'desc' },
        include: costInclude,
      }),
      this.prisma.vehicleCost.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findById(id: string, vehicleId: string) {
    return this.prisma.vehicleCost.findFirst({
      where: { id, vehicleId, tenantId: this.tenantId() },
      include: costInclude,
    });
  }

  async create(data: Prisma.VehicleCostUncheckedCreateInput) {
    return this.prisma.vehicleCost.create({
      data,
      include: costInclude,
    });
  }

  async update(id: string, data: Prisma.VehicleCostUncheckedUpdateInput) {
    return this.prisma.vehicleCost.update({
      where: { id },
      data,
      include: costInclude,
    });
  }

  async delete(id: string) {
    return this.prisma.vehicleCost.delete({ where: { id } });
  }

  async assertVehicle(vehicleId: string) {
    return this.prisma.vehicle.findFirst({
      where: { id: vehicleId, tenantId: this.tenantId() },
    });
  }
}
