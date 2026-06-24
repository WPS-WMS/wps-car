import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { PricingEngineService } from '../../domain/services/pricing-engine.service';
import { FipeLookupService } from '../../infrastructure/fipe/fipe-lookup.service';
import { MarketListingsService } from '../../infrastructure/market/market-listings.service';
import { DataScopeService } from '../../infrastructure/scope/data-scope.service';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import {
  TENANT_SETTING_DEFAULTS,
  TENANT_SETTING_KEYS,
} from '../settings/constants/tenant-setting-keys';
import { TenantSettingsService } from '../settings/tenant-settings.service';
import { VehiclesRepository } from '../vehicles/repositories/vehicles.repository';
import { AnalyzePricingDto } from './dto/analyze-pricing.dto';
import { ListPricingHistoryQueryDto } from './dto/list-pricing-history-query.dto';
import { toPricingIntelligenceQueryResponse } from './pricing-intelligence.mapper';
import { PricingIntelligenceRepository } from './repositories/pricing-intelligence.repository';
import { PricingMarketDataRepository } from './repositories/pricing-market-data.repository';
import { MarketListingsResult } from '../../infrastructure/market/market-listings.types';

@Injectable()
export class PricingIntelligenceService {
  constructor(
    private readonly repository: PricingIntelligenceRepository,
    private readonly marketDataRepository: PricingMarketDataRepository,
    private readonly vehiclesRepository: VehiclesRepository,
    private readonly fipeLookup: FipeLookupService,
    private readonly marketListings: MarketListingsService,
    private readonly pricingEngine: PricingEngineService,
    private readonly tenantSettings: TenantSettingsService,
    private readonly dataScope: DataScopeService,
  ) {}

  async analyze(dto: AnalyzePricingDto, actor: AuthenticatedUser) {
    const vehicle = await this.vehiclesRepository.findById(dto.vehicleId);
    if (!vehicle) {
      throw new NotFoundException('Veículo não encontrado');
    }

    this.dataScope.assertVehicleAccess(vehicle, actor);

    const financial = vehicle.financial;
    if (!financial) {
      throw new NotFoundException('Ficha financeira não encontrada para este veículo');
    }

    const purchaseValue = Number(financial.purchaseValue.toString());
    const totalCosts = Number(financial.totalCosts.toString());
    const minMarginPercent = dto.minMarginPercent ?? (await this.resolveDefaultMarginPercent());

    const filters = {
      brand: vehicle.brand,
      model: vehicle.model,
      modelYear: vehicle.modelYear,
      excludeVehicleId: vehicle.id,
    };

    const fipeResolved = await this.resolveFipeValue(vehicle, financial);

    const [soldStats, stockStats, tenantAvgDaysToSell, marketListings] =
      await Promise.all([
        this.marketDataRepository.getSimilarSoldStats(filters),
        this.marketDataRepository.getSimilarStockStats(filters),
        this.marketDataRepository.getTenantAverageDaysToSell(),
        this.marketListings
          .lookupSimilarListings({
            brand: vehicle.brand,
            model: vehicle.model,
            modelYear: vehicle.modelYear,
            mileage: vehicle.mileage,
            fipeValue: fipeResolved.value,
          })
          .catch(() => null),
      ]);

    const tenantAvgDays =
      soldStats.averageDaysToSell ?? tenantAvgDaysToSell ?? null;

    const sources = {
      fipe: fipeResolved.value,
      internalSoldAvg: soldStats.averageSalePrice,
      internalSoldCount: soldStats.count,
      internalStockAvg: stockStats.averageListedPrice,
      internalStockCount: stockStats.count,
      marketPortalAvg: marketListings?.averageListingPrice ?? null,
      marketPortalProvider: marketListings?.provider ?? 'unavailable',
      tenantAvgDaysToSell: tenantAvgDays,
    };

    const engineResult = this.pricingEngine.analyze({
      purchaseValue,
      totalCosts,
      daysInStock: financial.daysInStock,
      minMarginPercent,
      sources,
    });

    const vehicleLabel = `${vehicle.brand} ${vehicle.model} ${vehicle.modelYear}`;

    const saved = await this.repository.create({
      vehicleId: vehicle.id,
      userId: actor.id,
      fipeValue: fipeResolved.value,
      marketReference: engineResult.marketReference,
      minMarginPercent,
      conservativePrice: engineResult.conservative,
      competitivePrice: engineResult.competitive,
      aggressivePrice: engineResult.aggressive,
      idealListingPrice: engineResult.idealListing,
      minimumRecommended: engineResult.minimumRecommended,
      rawResponse: {
        vehicleLabel,
        vehicle: {
          id: vehicle.id,
          brand: vehicle.brand,
          model: vehicle.model,
          version: vehicle.version,
          modelYear: vehicle.modelYear,
          licensePlate: vehicle.licensePlate,
          mileage: vehicle.mileage,
          status: vehicle.status,
        },
        fipe: fipeResolved,
        sources: {
          fipe: {
            value: fipeResolved.value?.toFixed(2) ?? null,
            provider: fipeResolved.provider,
            referenceMonth: fipeResolved.referenceMonth ?? null,
          },
          internalHistory: {
            sampleCount: soldStats.count,
            averageSalePrice: soldStats.averageSalePrice?.toFixed(2) ?? null,
            averageDaysToSell: soldStats.averageDaysToSell
              ? Math.round(soldStats.averageDaysToSell)
              : null,
          },
          similarInStock: {
            sampleCount: stockStats.count,
            averageListedPrice: stockStats.averageListedPrice?.toFixed(2) ?? null,
          },
          marketPortals: this.mapMarketPortals(marketListings),
          tenantAvgDaysToSell: tenantAvgDays ? Math.round(tenantAvgDays) : null,
        },
        context: {
          purchaseValue: purchaseValue.toFixed(2),
          totalCosts: totalCosts.toFixed(2),
          totalInvested: (purchaseValue + totalCosts).toFixed(2),
          daysInStock: financial.daysInStock,
          minMarginPercent,
          minPriceFromMargin: engineResult.minPriceFromMargin.toFixed(2),
          urgencyAdjustmentPercent: Number(
            (engineResult.urgencyAdjustmentPercent * 100).toFixed(2),
          ),
        },
        sourceWeights: engineResult.sourceWeights.map((source) => ({
          label: source.label,
          value: source.value?.toFixed(2) ?? null,
          weight: source.weight,
        })),
        insights: engineResult.insights,
      } as unknown as Prisma.InputJsonValue,
    });

    return {
      queryId: saved.id,
      vehicle: {
        id: vehicle.id,
        label: vehicleLabel,
        brand: vehicle.brand,
        model: vehicle.model,
        version: vehicle.version,
        modelYear: vehicle.modelYear,
        licensePlate: vehicle.licensePlate,
        mileage: vehicle.mileage,
        status: vehicle.status,
      },
      fipe: {
        value: fipeResolved.value?.toFixed(2) ?? null,
        provider: fipeResolved.provider,
        referenceMonth: fipeResolved.referenceMonth ?? null,
      },
      sources: {
        internalHistory: {
          sampleCount: soldStats.count,
          averageSalePrice: soldStats.averageSalePrice?.toFixed(2) ?? null,
          averageDaysToSell: soldStats.averageDaysToSell
            ? Math.round(soldStats.averageDaysToSell)
            : null,
        },
        similarInStock: {
          sampleCount: stockStats.count,
          averageListedPrice: stockStats.averageListedPrice?.toFixed(2) ?? null,
        },
        marketPortals: this.mapMarketPortals(marketListings),
        tenantAvgDaysToSell: tenantAvgDays ? Math.round(tenantAvgDays) : null,
      },
      context: {
        purchaseValue: purchaseValue.toFixed(2),
        totalCosts: totalCosts.toFixed(2),
        totalInvested: (purchaseValue + totalCosts).toFixed(2),
        daysInStock: financial.daysInStock,
        minMarginPercent,
        marketReference: engineResult.marketReference.toFixed(2),
        minPriceFromMargin: engineResult.minPriceFromMargin.toFixed(2),
        urgencyAdjustmentPercent: Number(
          (engineResult.urgencyAdjustmentPercent * 100).toFixed(2),
        ),
      },
      suggestions: {
        conservative: engineResult.conservative.toFixed(2),
        competitive: engineResult.competitive.toFixed(2),
        aggressive: engineResult.aggressive.toFixed(2),
        idealListing: engineResult.idealListing.toFixed(2),
        minimumRecommended: engineResult.minimumRecommended.toFixed(2),
      },
      insights: engineResult.insights,
      defaultsUsed: {
        minMarginPercent,
      },
    };
  }

  async listHistory(query: ListPricingHistoryQueryDto) {
    const { data, total, page, limit } = await this.repository.findPaginated(query);
    return new PaginatedResponseDto(
      data.map(toPricingIntelligenceQueryResponse),
      total,
      page,
      limit,
    );
  }

  private mapMarketPortals(marketListings: MarketListingsResult | null) {
    if (!marketListings) {
      return null;
    }

    return {
      provider: marketListings.provider,
      referenceMonth: marketListings.referenceMonth,
      averageListingPrice: marketListings.averageListingPrice.toFixed(2),
      sampleCount: marketListings.sampleCount,
      portals: marketListings.portals,
      portalQuotes: marketListings.portalQuotes.map((quote) => ({
        portal: quote.portal,
        averageListingPrice: quote.averageListingPrice.toFixed(2),
        sampleCount: quote.sampleCount,
        minPrice: quote.minPrice?.toFixed(2) ?? null,
        maxPrice: quote.maxPrice?.toFixed(2) ?? null,
        error: quote.error ?? null,
      })),
    };
  }

  private async resolveFipeValue(
    vehicle: {
      licensePlate: string | null;
      brand: string;
      model: string;
      modelYear: number;
    },
    financial: { fipeValue: { toString(): string } | null },
  ) {
    if (vehicle.licensePlate) {
      try {
        const lookup = await this.fipeLookup.lookupByPlate(vehicle.licensePlate);
        return {
          value: lookup.fipeValue,
          provider: lookup.provider,
          referenceMonth: lookup.referenceMonth,
        };
      } catch {
        // fallback to stored value
      }
    }

    if (financial.fipeValue) {
      return {
        value: Number(financial.fipeValue.toString()),
        provider: 'internal',
        referenceMonth: null as string | null,
      };
    }

    return {
      value: null,
      provider: 'unavailable',
      referenceMonth: null as string | null,
    };
  }

  private async resolveDefaultMarginPercent() {
    const { settings } = await this.tenantSettings.getAll();
    const value = Number(
      settings[TENANT_SETTING_KEYS.DEFAULT_MARGIN_PERCENT] ??
        TENANT_SETTING_DEFAULTS[TENANT_SETTING_KEYS.DEFAULT_MARGIN_PERCENT],
    );
    return Number.isFinite(value) ? value : 12;
  }
}
