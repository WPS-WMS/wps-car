import { Injectable } from '@nestjs/common';
import { Prisma, SaleStatus } from '@prisma/client';
import { TenantScopedRepository } from '../../../application/repositories/tenant-scoped.repository';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { TenantContextService } from '../../../infrastructure/tenant/tenant-context.service';

const financialInclude = {
  supplier: { select: { id: true, name: true } },
  customer: { select: { id: true, name: true } },
  seller: { select: { id: true, name: true, email: true } },
} satisfies Prisma.VehicleFinancialInclude;

@Injectable()
export class FinancialRepository extends TenantScopedRepository {
  constructor(
    tenantContext: TenantContextService,
    private readonly prisma: PrismaService,
  ) {
    super(tenantContext);
  }

  private tenantId() {
    return this.tenantContext.requireTenantId();
  }

  async findByVehicleId(vehicleId: string) {
    return this.prisma.vehicleFinancial.findFirst({
      where: { vehicleId, tenantId: this.tenantId() },
      include: financialInclude,
    });
  }

  async update(vehicleId: string, data: Prisma.VehicleFinancialUncheckedUpdateInput) {
    return this.prisma.vehicleFinancial.update({
      where: { vehicleId },
      data,
      include: financialInclude,
    });
  }

  async sumCosts(vehicleId: string): Promise<number> {
    const result = await this.prisma.vehicleCost.aggregate({
      where: { vehicleId, tenantId: this.tenantId() },
      _sum: { amount: true },
    });
    return Number(result._sum.amount?.toString() ?? 0);
  }

  async getDefaultCommissionRule(tenantId: string) {
    return this.prisma.commissionRule.findFirst({
      where: { tenantId, active: true, isDefault: true },
    });
  }

  async getVehicleCommissionOverride(vehicleId: string, tenantId: string) {
    return this.prisma.vehicleCommissionOverride.findUnique({
      where: { tenantId_vehicleId: { tenantId, vehicleId } },
    });
  }

  async getSellerCommissionRule(sellerId: string, tenantId: string) {
    return this.prisma.sellerCommissionRule.findFirst({
      where: { tenantId, sellerId, active: true },
    });
  }

  async assertVehicleInTenant(vehicleId: string) {
    return this.prisma.vehicle.findFirst({
      where: { id: vehicleId, tenantId: this.tenantId() },
    });
  }

  async findFinalizedSale(vehicleId: string) {
    return this.prisma.sale.findFirst({
      where: {
        vehicleId,
        tenantId: this.tenantId(),
        status: { in: [SaleStatus.SOLD, SaleStatus.COMPLETED] },
      },
      select: { id: true, commission: true },
      orderBy: { saleDate: 'desc' },
    });
  }

  async updateSaleCommission(saleId: string, commission: number) {
    return this.prisma.sale.update({
      where: { id: saleId },
      data: { commission },
    });
  }
}
