import { Injectable } from '@nestjs/common';

export type PricingSourceSnapshot = {
  fipe: number | null;
  internalSoldAvg: number | null;
  internalSoldCount: number;
  internalStockAvg: number | null;
  internalStockCount: number;
  marketPortalAvg: number | null;
  marketPortalProvider: string;
  tenantAvgDaysToSell: number | null;
};

export type PricingEngineInput = {
  purchaseValue: number;
  totalCosts: number;
  daysInStock: number | null;
  minMarginPercent: number;
  sources: PricingSourceSnapshot;
};

export type PricingEngineResult = {
  marketReference: number;
  minPriceFromMargin: number;
  urgencyAdjustmentPercent: number;
  conservative: number;
  competitive: number;
  aggressive: number;
  idealListing: number;
  minimumRecommended: number;
  sourceWeights: Array<{ label: string; value: number | null; weight: number }>;
  insights: string[];
};

@Injectable()
export class PricingEngineService {
  analyze(input: PricingEngineInput): PricingEngineResult {
    const totalInvested = input.purchaseValue + input.totalCosts;
    const minPriceFromMargin = this.round(
      totalInvested / Math.max(0.01, 1 - input.minMarginPercent / 100),
    );

    const sourceWeights = this.buildSourceWeights(input.sources);
    const marketReference = this.weightedReference(sourceWeights, totalInvested);

    const urgencyAdjustmentPercent = this.calculateUrgency(
      input.daysInStock,
      input.sources.tenantAvgDaysToSell,
    );

    const competitive = this.round(Math.max(marketReference, minPriceFromMargin));
    const conservative = this.round(Math.max(marketReference * 1.07, competitive));
    const aggressive = this.round(
      Math.max(marketReference * (1 - 0.05 - urgencyAdjustmentPercent), minPriceFromMargin * 0.98),
    );
    const minimumRecommended = this.round(
      Math.max(minPriceFromMargin, marketReference * 0.9, totalInvested),
    );
    const idealListing = this.roundToListingPrice(
      competitive,
      input.daysInStock,
      input.sources.tenantAvgDaysToSell,
    );

    const insights = this.buildInsights({
      input,
      marketReference,
      minPriceFromMargin,
      urgencyAdjustmentPercent,
      sourceWeights,
    });

    return {
      marketReference,
      minPriceFromMargin,
      urgencyAdjustmentPercent,
      conservative,
      competitive,
      aggressive,
      idealListing,
      minimumRecommended,
      sourceWeights,
      insights,
    };
  }

  private buildSourceWeights(sources: PricingSourceSnapshot) {
    return [
      { label: 'FIPE', value: sources.fipe, weight: 0.35 },
      {
        label: 'Histórico interno',
        value: sources.internalSoldAvg,
        weight: sources.internalSoldCount >= 2 ? 0.3 : 0.15,
      },
      {
        label: 'Estoque similar',
        value: sources.internalStockAvg,
        weight: sources.internalStockCount >= 2 ? 0.2 : 0.1,
      },
      {
        label: 'Portais de venda',
        value: sources.marketPortalAvg,
        weight: 0.15,
      },
    ];
  }

  private weightedReference(
    sourceWeights: Array<{ label: string; value: number | null; weight: number }>,
    fallback: number,
  ) {
    const available = sourceWeights.filter(
      (source) => source.value !== null && source.value > 0,
    );

    if (available.length === 0) {
      return this.round(Math.max(fallback * 1.15, 0));
    }

    const totalWeight = available.reduce((sum, source) => sum + source.weight, 0);
    const weighted =
      available.reduce((sum, source) => sum + (source.value as number) * source.weight, 0) /
      totalWeight;

    return this.round(weighted);
  }

  private calculateUrgency(
    daysInStock: number | null,
    tenantAvgDaysToSell: number | null,
  ) {
    if (!daysInStock || !tenantAvgDaysToSell || tenantAvgDaysToSell <= 0) {
      return 0;
    }

    if (daysInStock <= tenantAvgDaysToSell) {
      return 0;
    }

    return Math.min(
      0.06,
      ((daysInStock - tenantAvgDaysToSell) / tenantAvgDaysToSell) * 0.03,
    );
  }

  private roundToListingPrice(
    competitive: number,
    daysInStock: number | null,
    tenantAvgDaysToSell: number | null,
  ) {
    let target = competitive;

    if (
      daysInStock !== null &&
      tenantAvgDaysToSell !== null &&
      tenantAvgDaysToSell > 0 &&
      daysInStock < tenantAvgDaysToSell * 0.7
    ) {
      target = competitive * 1.02;
    }

    return this.round(Math.round(target / 500) * 500);
  }

  private buildInsights(params: {
    input: PricingEngineInput;
    marketReference: number;
    minPriceFromMargin: number;
    urgencyAdjustmentPercent: number;
    sourceWeights: Array<{ label: string; value: number | null; weight: number }>;
  }) {
    const insights: string[] = [];
    const { input, marketReference, minPriceFromMargin, urgencyAdjustmentPercent, sourceWeights } =
      params;

    const usedSources = sourceWeights
      .filter((source) => source.value !== null && source.value > 0)
      .map((source) => source.label);

    if (usedSources.length) {
      insights.push(`Referência de mercado calculada com: ${usedSources.join(', ')}.`);
    } else {
      insights.push(
        'Poucos dados externos disponíveis; sugestão baseada no custo total e margem mínima.',
      );
    }

    if (input.sources.internalSoldCount >= 3) {
      insights.push(
        `Histórico interno com ${input.sources.internalSoldCount} vendas semelhantes reforça a referência.`,
      );
    } else if (input.sources.internalSoldCount === 0) {
      insights.push('Sem vendas semelhantes no histórico desta revenda.');
    }

    if (
      input.daysInStock !== null &&
      input.sources.tenantAvgDaysToSell !== null &&
      input.daysInStock > input.sources.tenantAvgDaysToSell
    ) {
      insights.push(
        `Veículo há ${input.daysInStock} dias no estoque (média da loja: ${Math.round(input.sources.tenantAvgDaysToSell)} dias) — preço agressivo ajustado para acelerar a venda.`,
      );
    }

    if (urgencyAdjustmentPercent > 0) {
      insights.push(
        `Ajuste de urgência de ${(urgencyAdjustmentPercent * 100).toFixed(1)}% aplicado no preço agressivo.`,
      );
    }

    if (marketReference < minPriceFromMargin) {
      insights.push(
        `Referência de mercado abaixo da margem mínima (${input.minMarginPercent}%); preços elevados ao piso financeiro.`,
      );
    }

    return insights;
  }

  private round(value: number, decimals = 2) {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
  }
}
