import { Injectable } from '@nestjs/common';
import { CommissionRuleType, Prisma } from '@prisma/client';
import { VehicleFinancialCalculatorService } from '../../../domain/services/vehicle-financial-calculator.service';
import { FinancialRepository } from '../repositories/financial.repository';

@Injectable()
export class FinancialRecalculationService {
  constructor(
    private readonly financialRepository: FinancialRepository,
    private readonly calculator: VehicleFinancialCalculatorService,
  ) {}

  async recalculate(vehicleId: string) {
    const financial = await this.financialRepository.findByVehicleId(vehicleId);
    if (!financial) {
      return null;
    }

    const totalCosts = await this.financialRepository.sumCosts(vehicleId);
    const finalizedSale = await this.financialRepository.findFinalizedSale(vehicleId);
    const commission = await this.resolveCommission(
      vehicleId,
      financial.tenantId,
      financial.sellerId,
      finalizedSale,
    );

    const purchaseValue = Number(financial.purchaseValue.toString());
    const saleValue = financial.saleValue
      ? Number(financial.saleValue.toString())
      : null;

    const result = this.calculator.calculate({
      purchaseValue,
      totalCosts,
      saleValue,
      purchaseDate: financial.purchaseDate,
      saleDate: financial.saleDate,
      commission,
    });

    const updated = await this.financialRepository.update(vehicleId, {
      totalCosts,
      commissionValue: result.commissionValue,
      grossProfit: result.grossProfit,
      marginAmount: result.marginAmount,
      marginPercent: result.marginPercent,
      netResult: result.netResult,
      daysInStock: result.daysInStock,
      calculatedAt: new Date(),
    });

    // Garante snapshot da comissão na venda finalizada (congela para recálculos futuros).
    if (
      finalizedSale &&
      finalizedSale.commission == null &&
      result.commissionValue != null
    ) {
      await this.financialRepository.updateSaleCommission(
        finalizedSale.id,
        result.commissionValue,
      );
    }

    return updated;
  }

  private async resolveCommission(
    vehicleId: string,
    tenantId: string,
    sellerId: string | null | undefined,
    finalizedSale: { id: string; commission: Prisma.Decimal | null } | null,
  ) {
    // Venda finalizada: usa comissão registrada na venda, não regras atuais do vendedor.
    if (finalizedSale?.commission != null) {
      return {
        type: CommissionRuleType.FIXED_AMOUNT,
        value: Number(finalizedSale.commission.toString()),
      };
    }

    const override = await this.financialRepository.getVehicleCommissionOverride(
      vehicleId,
      tenantId,
    );

    if (override) {
      return {
        type: override.type,
        value: Number(override.value.toString()),
      };
    }

    if (sellerId) {
      const sellerRule = await this.financialRepository.getSellerCommissionRule(
        sellerId,
        tenantId,
      );
      if (sellerRule) {
        if (sellerRule.type === CommissionRuleType.CUSTOM_PER_VEHICLE) {
          // Sem regra padrão: depende de override por veículo (se existir).
          return null;
        }
        return {
          type: sellerRule.type,
          value: Number(sellerRule.value.toString()),
        };
      }
    }

    const rule = await this.financialRepository.getDefaultCommissionRule(tenantId);
    if (!rule) {
      return null;
    }

    return {
      type: rule.type,
      value: Number(rule.value.toString()),
    };
  }
}
