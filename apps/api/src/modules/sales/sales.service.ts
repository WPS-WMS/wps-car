import { Injectable } from '@nestjs/common';
import { SaleStatus, UserRole, VehicleStatus } from '@prisma/client';
import { DomainException } from '../../domain/exceptions/domain.exception';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { toSaleResponse } from '../../common/mappers/sale.mapper';
import { DataScopeService } from '../../infrastructure/scope/data-scope.service';
import { TenantContextService } from '../../infrastructure/tenant/tenant-context.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { FinancialRepository } from '../financial/repositories/financial.repository';
import { FinancialRecalculationService } from '../financial/services/financial-recalculation.service';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { ListSalesQueryDto } from './dto/list-sales-query.dto';
import { SalesRepository } from './repositories/sales.repository';
import { CommissionReportQueryDto } from './dto/commission-report-query.dto';

const FINALIZED_STATUSES: SaleStatus[] = [SaleStatus.SOLD, SaleStatus.COMPLETED];

@Injectable()
export class SalesService {
  constructor(
    private readonly salesRepository: SalesRepository,
    private readonly financialRepository: FinancialRepository,
    private readonly recalculationService: FinancialRecalculationService,
    private readonly tenantContext: TenantContextService,
    private readonly prisma: PrismaService,
    private readonly dataScope: DataScopeService,
  ) {}

  async findAll(query: ListSalesQueryDto, actor: AuthenticatedUser) {
    const saleScope = await this.dataScope.buildSaleScope(actor, {
      branchId: query.branchId,
      sellerId: query.sellerId,
    });

    const { data, total, page, limit } = await this.salesRepository.findManyPaginated(
      query,
      saleScope,
    );

    return new PaginatedResponseDto(
      data.map(toSaleResponse),
      total,
      page,
      limit,
    );
  }

  async findById(id: string, actor: AuthenticatedUser) {
    const sale = await this.salesRepository.findById(id);
    if (!sale) {
      throw new DomainException('SALE_NOT_FOUND', 'Venda não encontrada', 404);
    }
    await this.dataScope.assertSaleAccess(sale.sellerId, actor);
    return toSaleResponse(sale);
  }

  async create(dto: CreateSaleDto, actor: AuthenticatedUser) {
    const tenantId = this.tenantContext.requireTenantId();

    await this.assertVehicleAvailable(dto.vehicleId);
    await this.assertCustomer(dto.customerId);

    const sellerId = this.resolveSellerId(dto.sellerId, actor);
    await this.assertSeller(sellerId);

    const activeSale = await this.salesRepository.findActiveByVehicle(dto.vehicleId);
    if (activeSale) {
      throw new DomainException(
        'VEHICLE_HAS_ACTIVE_SALE',
        'Veículo já possui venda em andamento',
        409,
      );
    }

    const status = dto.status ?? SaleStatus.NEGOTIATION;

    const sale = await this.salesRepository.create({
      tenantId,
      vehicleId: dto.vehicleId,
      customerId: dto.customerId,
      sellerId,
      amount: dto.amount,
      paymentMethod: dto.paymentMethod,
      saleDate: dto.saleDate,
      status,
      notes: dto.notes,
      createdById: actor.id,
      updatedById: actor.id,
    });

    await this.applyStatusSideEffects(sale, status, dto.amount, dto.saleDate);

    const refreshed = await this.salesRepository.findById(sale.id);
    return toSaleResponse(refreshed!);
  }

  async update(id: string, dto: UpdateSaleDto, actor: AuthenticatedUser) {
    const sale = await this.salesRepository.findById(id);
    if (!sale) {
      throw new DomainException('SALE_NOT_FOUND', 'Venda não encontrada', 404);
    }

    await this.dataScope.assertSaleAccess(sale.sellerId, actor);

    if (FINALIZED_STATUSES.includes(sale.status) && dto.status !== SaleStatus.CANCELLED) {
      throw new DomainException(
        'SALE_FINALIZED',
        'Venda finalizada não pode ser alterada (exceto cancelamento)',
        403,
      );
    }

    if (dto.sellerId && actor.role === UserRole.SELLER && dto.sellerId !== actor.id) {
      throw new DomainException('SELLER_CANNOT_REASSIGN', 'Vendedor não pode reatribuir venda', 403);
    }

    if (dto.customerId) await this.assertCustomer(dto.customerId);
    if (dto.sellerId) await this.assertSeller(dto.sellerId);

    const newStatus = dto.status ?? sale.status;
    const newAmount = dto.amount ?? Number(sale.amount.toString());
    const newSaleDate = dto.saleDate ?? sale.saleDate;

    const updated = await this.salesRepository.update(id, {
      customerId: dto.customerId,
      sellerId: dto.sellerId,
      amount: dto.amount,
      paymentMethod: dto.paymentMethod,
      saleDate: dto.saleDate,
      status: dto.status,
      notes: dto.notes,
      updatedById: actor.id,
    });

    if (dto.status && dto.status !== sale.status) {
      if (
        dto.status === SaleStatus.CANCELLED &&
        FINALIZED_STATUSES.includes(sale.status)
      ) {
        await this.revertFinalizedSale(sale.vehicleId, sale.id);
      } else {
        await this.applyStatusSideEffects(updated, newStatus, newAmount, newSaleDate);
      }
    } else if (FINALIZED_STATUSES.includes(newStatus) && (dto.amount || dto.saleDate)) {
      await this.syncFinancialOnFinalize(updated, newAmount, newSaleDate);
    }

    const refreshed = await this.salesRepository.findById(id);
    return toSaleResponse(refreshed!);
  }

  async getMyCommissionSummary(
    actor: AuthenticatedUser,
    startDate?: Date,
    endDate?: Date,
  ) {
    return this.salesRepository.getSellerCommissionSummary(
      actor.id,
      startDate,
      endDate,
    );
  }

  async getSellerCommissionSummary(
    sellerId: string,
    startDate: Date | undefined,
    endDate: Date | undefined,
    actor: AuthenticatedUser,
  ) {
    await this.assertSeller(sellerId);
    await this.dataScope.assertSaleAccess(sellerId, actor);
    const summary = await this.salesRepository.getSellerCommissionSummary(
      sellerId,
      startDate,
      endDate,
    );
    return { sellerId, ...summary };
  }

  async getCommissionReport(actor: AuthenticatedUser, query: CommissionReportQueryDto) {
    const saleScope = await this.dataScope.buildSaleScope(actor, {
      branchId: query.branchId,
      sellerId: query.sellerId,
    });

    const rows = await this.salesRepository.getCommissionReport(query, saleScope);

    const normalized = rows.map((s) => {
      const amount = Number((s.amount as any)?.toString?.() ?? s.amount ?? 0);
      const commission = Number((s.commission as any)?.toString?.() ?? s.commission ?? 0);
      const profit = Number((s.vehicle?.financial?.netResult as any)?.toString?.() ?? 0);
      return { sale: s, amount, commission, profit };
    });

    const vehiclesSold = normalized.length;
    const totalSalesAmount = normalized.reduce((sum, r) => sum + r.amount, 0);
    const totalProfit = normalized.reduce((sum, r) => sum + r.profit, 0);
    const totalCommission = normalized.reduce((sum, r) => sum + r.commission, 0);

    return {
      summary: {
        vehiclesSold,
        totalSalesAmount: totalSalesAmount.toFixed(2),
        totalProfit: totalProfit.toFixed(2),
        totalCommission: totalCommission.toFixed(2),
      },
      rows: normalized.map((r) => ({
        id: r.sale.id,
        saleDate: r.sale.saleDate,
        status: r.sale.status,
        seller: r.sale.seller,
        vehicle: r.sale.vehicle
          ? {
              id: r.sale.vehicle.id,
              brand: r.sale.vehicle.brand,
              model: r.sale.vehicle.model,
              licensePlate: r.sale.vehicle.licensePlate,
              type: r.sale.vehicle.type,
            }
          : null,
        amount: r.amount.toFixed(2),
        profit: r.profit ? r.profit.toFixed(2) : null,
        commission: r.commission ? r.commission.toFixed(2) : null,
      })),
    };
  }

  private async applyStatusSideEffects(
    sale: { id: string; vehicleId: string; customerId: string; sellerId: string },
    status: SaleStatus,
    amount: number,
    saleDate: Date,
  ) {
    switch (status) {
      case SaleStatus.NEGOTIATION:
      case SaleStatus.AWAITING_PAYMENT:
        await this.prisma.vehicle.update({
          where: { id: sale.vehicleId },
          data: { status: VehicleStatus.RESERVED },
        });
        break;
      case SaleStatus.SOLD:
      case SaleStatus.COMPLETED:
        await this.syncFinancialOnFinalize(sale, amount, saleDate);
        break;
      case SaleStatus.CANCELLED:
        await this.handleCancellation(sale.vehicleId);
        break;
    }
  }

  private async syncFinancialOnFinalize(
    sale: { id: string; vehicleId: string; customerId: string; sellerId: string },
    amount: number,
    saleDate: Date,
  ) {
    await this.prisma.vehicle.update({
      where: { id: sale.vehicleId },
      data: { status: VehicleStatus.SOLD },
    });

    await this.financialRepository.update(sale.vehicleId, {
      saleValue: amount,
      saleDate,
      customerId: sale.customerId,
      sellerId: sale.sellerId,
    });

    const financial = await this.recalculationService.recalculate(sale.vehicleId);

    if (financial) {
      await this.salesRepository.update(sale.id, {
        commission: financial.commissionValue,
      });
    }
  }

  private async handleCancellation(vehicleId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (vehicle?.status === VehicleStatus.RESERVED) {
      await this.prisma.vehicle.update({
        where: { id: vehicleId },
        data: { status: VehicleStatus.IN_STOCK },
      });
    }
  }

  private async revertFinalizedSale(vehicleId: string, saleId: string) {
    await this.financialRepository.update(vehicleId, {
      saleValue: null,
      saleDate: null,
      customerId: null,
      sellerId: null,
    });

    await this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: { status: VehicleStatus.IN_STOCK },
    });

    await this.recalculationService.recalculate(vehicleId);

    await this.salesRepository.update(saleId, {
      commission: null,
    });
  }

  private resolveSellerId(sellerId: string | undefined, actor: AuthenticatedUser): string {
    if (actor.role === UserRole.SELLER) {
      return actor.id;
    }
    if (!sellerId) {
      throw new DomainException('SELLER_REQUIRED', 'Vendedor é obrigatório', 400);
    }
    return sellerId;
  }

  private async assertVehicleAvailable(vehicleId: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, tenantId: this.tenantContext.requireTenantId() },
    });
    if (!vehicle) {
      throw new DomainException('VEHICLE_NOT_FOUND', 'Veículo não encontrado', 404);
    }
    if (vehicle.status === VehicleStatus.SOLD) {
      throw new DomainException('VEHICLE_ALREADY_SOLD', 'Veículo já vendido', 409);
    }
  }

  private async assertCustomer(customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, tenantId: this.tenantContext.requireTenantId(), active: true },
    });
    if (!customer) {
      throw new DomainException('CUSTOMER_NOT_FOUND', 'Cliente não encontrado', 400);
    }
  }

  private async assertSeller(sellerId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: sellerId,
        tenantId: this.tenantContext.requireTenantId(),
        active: true,
        role: { in: [UserRole.SELLER, UserRole.MANAGER, UserRole.ADMIN] },
      },
    });
    if (!user) {
      throw new DomainException('SELLER_NOT_FOUND', 'Vendedor não encontrado', 400);
    }
  }
}
