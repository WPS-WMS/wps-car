import { Injectable } from '@nestjs/common';
import { CommissionRuleType } from '@prisma/client';

export interface CommissionConfig {
  type: CommissionRuleType;
  value: number;
}

export interface FinancialCalculationInput {
  purchaseValue: number;
  totalCosts: number;
  saleValue: number | null;
  purchaseDate: Date | null;
  saleDate: Date | null;
  commission: CommissionConfig | null;
}

export interface FinancialCalculationResult {
  commissionValue: number;
  grossProfit: number | null;
  marginAmount: number | null;
  marginPercent: number | null;
  netResult: number | null;
  daysInStock: number | null;
}

@Injectable()
export class VehicleFinancialCalculatorService {
  calculate(input: FinancialCalculationInput): FinancialCalculationResult {
    const { purchaseValue, totalCosts, saleValue, purchaseDate, saleDate, commission } =
      input;

    const commissionValue = this.calculateCommission(
      commission,
      purchaseValue,
      totalCosts,
      saleValue,
    );

    let grossProfit: number | null = null;
    let netResult: number | null = null;
    let marginAmount: number | null = null;
    let marginPercent: number | null = null;

    if (saleValue !== null && saleValue > 0) {
      const profitBeforeCommission = this.round(
        saleValue - purchaseValue - totalCosts,
      );
      // Lucro bruto e margem R$: venda - compra - custos
      grossProfit = profitBeforeCommission;
      marginAmount = profitBeforeCommission;
      // Resultado líquido: venda - compra - custos - comissão
      netResult = this.round(profitBeforeCommission - commissionValue);
      marginPercent = this.round((netResult / saleValue) * 100, 4);
    }

    const daysInStock = this.calculateDaysInStock(purchaseDate, saleDate);

    return {
      commissionValue,
      grossProfit,
      marginAmount,
      marginPercent,
      netResult,
      daysInStock,
    };
  }

  calculateSuggestedPurchase(
    fipeValue: number,
    estimatedCosts: number,
    desiredMarginPercent?: number,
    desiredMarginAmount?: number,
  ): number {
    let margin = 0;
    if (desiredMarginAmount !== undefined) {
      margin = desiredMarginAmount;
    } else if (desiredMarginPercent !== undefined) {
      margin = fipeValue * (desiredMarginPercent / 100);
    }
    return this.round(Math.max(0, fipeValue - margin - estimatedCosts));
  }

  private calculateCommission(
    commission: CommissionConfig | null,
    purchaseValue: number,
    totalCosts: number,
    saleValue: number | null,
  ): number {
    if (!commission || saleValue === null || saleValue <= 0) {
      return 0;
    }

    const { type, value } = commission;

    switch (type) {
      case CommissionRuleType.SALE_PERCENTAGE:
        return this.round(saleValue * (value / 100));
      case CommissionRuleType.PROFIT_PERCENTAGE: {
        const profitBeforeCommission = saleValue - purchaseValue - totalCosts;
        return this.round(Math.max(0, profitBeforeCommission) * (value / 100));
      }
      case CommissionRuleType.FIXED_AMOUNT:
      case CommissionRuleType.CUSTOM_PER_VEHICLE:
        return this.round(value);
      default:
        return 0;
    }
  }

  private calculateDaysInStock(
    purchaseDate: Date | null,
    saleDate: Date | null,
  ): number | null {
    if (!purchaseDate) return null;

    const end = saleDate ?? new Date();
    const start = new Date(purchaseDate);
    const diffMs = end.getTime() - start.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }

  private round(value: number, decimals = 2): number {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
  }
}
