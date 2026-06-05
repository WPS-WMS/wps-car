import { Injectable } from '@nestjs/common';
import { DomainException } from '../../domain/exceptions/domain.exception';
import { VehicleFinancialCalculatorService } from '../../domain/services/vehicle-financial-calculator.service';
import {
  toFinancialDetailResponse,
  toFinancialResultSummary,
} from '../../common/mappers/financial.mapper';
import { TenantContextService } from '../../infrastructure/tenant/tenant-context.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { FinancialRepository } from './repositories/financial.repository';
import { FinancialRecalculationService } from './services/financial-recalculation.service';
import { UpdateFinancialDto } from './dto/update-financial.dto';
import { SuggestPurchaseDto } from './dto/suggest-purchase.dto';

@Injectable()
export class FinancialService {
  constructor(
    private readonly financialRepository: FinancialRepository,
    private readonly recalculationService: FinancialRecalculationService,
    private readonly calculator: VehicleFinancialCalculatorService,
    private readonly tenantContext: TenantContextService,
    private readonly prisma: PrismaService,
  ) {}

  async getByVehicle(vehicleId: string) {
    await this.assertVehicle(vehicleId);
    const financial = await this.financialRepository.findByVehicleId(vehicleId);
    if (!financial) {
      throw new DomainException(
        'FINANCIAL_NOT_FOUND',
        'Dados financeiros não encontrados',
        404,
      );
    }
    return toFinancialDetailResponse(financial);
  }

  async update(vehicleId: string, dto: UpdateFinancialDto) {
    await this.assertVehicle(vehicleId);

    const existing = await this.financialRepository.findByVehicleId(vehicleId);
    if (!existing) {
      throw new DomainException('FINANCIAL_NOT_FOUND', 'Dados financeiros não encontrados', 404);
    }

    if (dto.supplierId) await this.assertSupplier(dto.supplierId);
    if (dto.customerId) await this.assertCustomer(dto.customerId);
    if (dto.sellerId) await this.assertSeller(dto.sellerId);

    await this.financialRepository.update(vehicleId, {
      purchaseValue: dto.purchaseValue,
      purchaseDate: dto.purchaseDate,
      supplierId: dto.supplierId,
      fipeValue: dto.fipeValue,
      suggestedPurchaseValue: dto.suggestedPurchaseValue,
      listedValue: dto.listedValue,
      minimumValue: dto.minimumValue,
      saleValue: dto.saleValue,
      saleDate: dto.saleDate,
      customerId: dto.customerId,
      sellerId: dto.sellerId,
    });

    const recalculated = await this.recalculationService.recalculate(vehicleId);
    return toFinancialDetailResponse(recalculated!);
  }

  async recalculate(vehicleId: string) {
    await this.assertVehicle(vehicleId);
    const financial = await this.recalculationService.recalculate(vehicleId);
    if (!financial) {
      throw new DomainException('FINANCIAL_NOT_FOUND', 'Dados financeiros não encontrados', 404);
    }
    return {
      message: 'Resultado recalculado',
      result: toFinancialResultSummary(financial),
    };
  }

  async suggestPurchase(vehicleId: string, dto: SuggestPurchaseDto) {
    await this.assertVehicle(vehicleId);

    if (dto.desiredMarginPercent === undefined && dto.desiredMarginAmount === undefined) {
      throw new DomainException(
        'MARGIN_REQUIRED',
        'Informe desiredMarginPercent ou desiredMarginAmount',
        400,
      );
    }

    const maxPurchase = this.calculator.calculateSuggestedPurchase(
      dto.fipeValue,
      dto.estimatedCosts,
      dto.desiredMarginPercent,
      dto.desiredMarginAmount,
    );

    await this.financialRepository.update(vehicleId, {
      fipeValue: dto.fipeValue,
      suggestedPurchaseValue: maxPurchase,
    });

    return {
      fipeValue: dto.fipeValue.toFixed(2),
      estimatedCosts: dto.estimatedCosts.toFixed(2),
      desiredMarginPercent: dto.desiredMarginPercent,
      desiredMarginAmount: dto.desiredMarginAmount?.toFixed(2),
      suggestedPurchaseValue: maxPurchase.toFixed(2),
      formula: 'ValorFIPE - MargemDesejada - CustosEstimados',
    };
  }

  private async assertVehicle(vehicleId: string) {
    const vehicle = await this.financialRepository.assertVehicleInTenant(vehicleId);
    if (!vehicle) {
      throw new DomainException('VEHICLE_NOT_FOUND', 'Veículo não encontrado', 404);
    }
  }

  private async assertSupplier(supplierId: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, tenantId: this.tenantContext.requireTenantId() },
    });
    if (!supplier) {
      throw new DomainException('SUPPLIER_NOT_FOUND', 'Fornecedor não encontrado', 400);
    }
  }

  private async assertCustomer(customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, tenantId: this.tenantContext.requireTenantId() },
    });
    if (!customer) {
      throw new DomainException('CUSTOMER_NOT_FOUND', 'Cliente não encontrado', 400);
    }
  }

  private async assertSeller(sellerId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: sellerId, tenantId: this.tenantContext.requireTenantId(), active: true },
    });
    if (!user) {
      throw new DomainException('SELLER_NOT_FOUND', 'Vendedor não encontrado', 400);
    }
  }
}
