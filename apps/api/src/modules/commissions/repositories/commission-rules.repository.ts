import { Injectable } from '@nestjs/common';
import { CommissionRuleType, Prisma } from '@prisma/client';
import { TenantScopedRepository } from '../../../application/repositories/tenant-scoped.repository';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { TenantContextService } from '../../../infrastructure/tenant/tenant-context.service';

@Injectable()
export class CommissionRulesRepository extends TenantScopedRepository {
  constructor(
    tenantContext: TenantContextService,
    private readonly prisma: PrismaService,
  ) {
    super(tenantContext);
  }

  private tenantId() {
    return this.tenantContext.requireTenantId();
  }

  async findAll(activeOnly?: boolean) {
    return this.prisma.commissionRule.findMany({
      where: {
        tenantId: this.tenantId(),
        ...(activeOnly && { active: true }),
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  async findById(id: string) {
    return this.prisma.commissionRule.findFirst({
      where: { id, tenantId: this.tenantId() },
    });
  }

  async create(data: Prisma.CommissionRuleUncheckedCreateInput) {
    return this.prisma.commissionRule.create({ data });
  }

  async update(id: string, data: Prisma.CommissionRuleUncheckedUpdateInput) {
    return this.prisma.commissionRule.update({ where: { id }, data });
  }

  async clearOtherDefaults(excludeId: string) {
    return this.prisma.commissionRule.updateMany({
      where: {
        tenantId: this.tenantId(),
        isDefault: true,
        id: { not: excludeId },
      },
      data: { isDefault: false },
    });
  }

  async findVehicleOverride(vehicleId: string) {
    return this.prisma.vehicleCommissionOverride.findUnique({
      where: {
        tenantId_vehicleId: {
          tenantId: this.tenantId(),
          vehicleId,
        },
      },
    });
  }

  async upsertVehicleOverride(
    vehicleId: string,
    data: { type: CommissionRuleType; value: number },
  ) {
    const tenantId = this.tenantId();
    return this.prisma.vehicleCommissionOverride.upsert({
      where: { tenantId_vehicleId: { tenantId, vehicleId } },
      create: { tenantId, vehicleId, type: data.type, value: data.value },
      update: { type: data.type, value: data.value },
    });
  }

  async deleteVehicleOverride(vehicleId: string) {
    return this.prisma.vehicleCommissionOverride.deleteMany({
      where: { vehicleId, tenantId: this.tenantId() },
    });
  }
}
