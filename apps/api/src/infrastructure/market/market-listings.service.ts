import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DomainException } from '../../domain/exceptions/domain.exception';
import {
  buildMarketRequestUrl,
  resolveMarketHttpConfig,
} from './market-endpoint.config';
import { parseMarketListingsPayload } from './market-listings-response.parser';
import {
  MarketListingsResult,
  MarketPortalEndpoint,
  MarketPortalQuote,
} from './market-listings.types';

export type MarketListingsVehicleInput = {
  brand: string;
  model: string;
  modelYear: number;
  mileage?: number | null;
  fipeValue?: number | null;
};

@Injectable()
export class MarketListingsService {
  private readonly logger = new Logger(MarketListingsService.name);

  constructor(private readonly config: ConfigService) {}

  async lookupSimilarListings(
    vehicle: MarketListingsVehicleInput,
  ): Promise<MarketListingsResult> {
    const provider = this.config.get<string>('market.provider') ?? 'mock';

    if (provider === 'http') {
      return this.lookupViaHttp(vehicle);
    }

    return this.lookupViaMock(vehicle);
  }

  private lookupViaMock(vehicle: MarketListingsVehicleInput): MarketListingsResult {
    const base =
      vehicle.fipeValue && vehicle.fipeValue > 0
        ? vehicle.fipeValue
        : this.estimateBasePrice(vehicle);

    const hash = `${vehicle.brand}${vehicle.model}${vehicle.modelYear}`.length;
    const premium = 1.03 + (hash % 7) * 0.01;
    const averageListingPrice = Math.round(base * premium);
    const sampleCount = 12 + (hash % 18);

    const portalQuotes: MarketPortalQuote[] = [
      {
        portal: 'WebMotors (simulado)',
        averageListingPrice: Math.round(averageListingPrice * 1.02),
        sampleCount: Math.round(sampleCount * 0.45),
        minPrice: Math.round(averageListingPrice * 0.94),
        maxPrice: Math.round(averageListingPrice * 1.08),
      },
      {
        portal: 'OLX (simulado)',
        averageListingPrice: Math.round(averageListingPrice * 0.98),
        sampleCount: Math.round(sampleCount * 0.35),
        minPrice: Math.round(averageListingPrice * 0.9),
        maxPrice: Math.round(averageListingPrice * 1.05),
      },
      {
        portal: 'iCarros (simulado)',
        averageListingPrice: Math.round(averageListingPrice * 1.01),
        sampleCount: Math.round(sampleCount * 0.2),
        minPrice: Math.round(averageListingPrice * 0.92),
        maxPrice: Math.round(averageListingPrice * 1.06),
      },
    ];

    return {
      provider: 'mock',
      referenceMonth: this.currentReferenceMonth(),
      averageListingPrice,
      sampleCount,
      portals: portalQuotes.map((quote) => quote.portal),
      portalQuotes,
    };
  }

  private async lookupViaHttp(
    vehicle: MarketListingsVehicleInput,
  ): Promise<MarketListingsResult> {
    const httpConfig = resolveMarketHttpConfig({
      httpUrl: this.config.get<string>('market.httpUrl'),
      httpUrls: this.config.get<string>('market.httpUrls'),
      httpHeaders: this.config.get<string>('market.httpHeaders'),
      httpApiKey: this.config.get<string>('market.httpApiKey'),
      httpTimeoutMs: this.config.get<number>('market.httpTimeoutMs'),
      httpMinSuccess: this.config.get<number>('market.httpMinSuccess'),
    });

    if (httpConfig.endpoints.length === 0) {
      throw new DomainException(
        'MARKET_PROVIDER_NOT_CONFIGURED',
        'Configure MARKET_LISTINGS_HTTP_URL ou MARKET_LISTINGS_HTTP_URLS',
        503,
      );
    }

    const settled = await Promise.allSettled(
      httpConfig.endpoints.map((endpoint) =>
        this.fetchPortalQuote(endpoint, vehicle, httpConfig.timeoutMs, httpConfig.headers),
      ),
    );

    const portalQuotes = settled
      .map((result, index) => {
        const endpoint = httpConfig.endpoints[index];

        if (result.status === 'fulfilled') {
          return result.value;
        }

        const message =
          result.reason instanceof Error ? result.reason.message : 'Falha na consulta';

        this.logger.warn(
          `Portal ${endpoint.name} indisponível para ${vehicle.brand} ${vehicle.model}: ${message}`,
        );

        return {
          portal: endpoint.name,
          averageListingPrice: 0,
          sampleCount: 0,
          minPrice: null,
          maxPrice: null,
          error: message,
        } satisfies MarketPortalQuote;
      })
      .filter(Boolean);

    const successfulQuotes = portalQuotes.filter(
      (quote) => !quote.error && quote.averageListingPrice > 0 && quote.sampleCount > 0,
    );

    if (successfulQuotes.length < httpConfig.minSuccess) {
      throw new DomainException(
        'MARKET_LOOKUP_FAILED',
        'Nenhum portal retornou preços válidos para o veículo',
        502,
      );
    }

    const totalSamples = successfulQuotes.reduce((sum, quote) => sum + quote.sampleCount, 0);
    const weightedAverage =
      successfulQuotes.reduce(
        (sum, quote) => sum + quote.averageListingPrice * quote.sampleCount,
        0,
      ) / Math.max(totalSamples, 1);

    return {
      provider: 'http',
      referenceMonth: this.currentReferenceMonth(),
      averageListingPrice: Math.round(weightedAverage),
      sampleCount: totalSamples,
      portals: successfulQuotes.map((quote) => quote.portal),
      portalQuotes,
      raw: {
        endpoints: httpConfig.endpoints.map((endpoint) => endpoint.name),
        successful: successfulQuotes.length,
        failed: portalQuotes.length - successfulQuotes.length,
      },
    };
  }

  private async fetchPortalQuote(
    endpoint: MarketPortalEndpoint,
    vehicle: MarketListingsVehicleInput,
    timeoutMs: number,
    headers: Record<string, string>,
  ): Promise<MarketPortalQuote> {
    const url = buildMarketRequestUrl(endpoint.url, vehicle);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = await response.json();
      const parsed = parseMarketListingsPayload(payload);

      if (!parsed) {
        throw new Error('Resposta sem preços reconhecíveis');
      }

      return {
        portal: endpoint.name,
        averageListingPrice: parsed.averageListingPrice,
        sampleCount: parsed.sampleCount,
        minPrice: parsed.minPrice,
        maxPrice: parsed.maxPrice,
      };
    } finally {
      clearTimeout(timer);
    }
  }

  private estimateBasePrice(vehicle: MarketListingsVehicleInput) {
    const yearFactor = Math.max(0.45, 1 - (new Date().getFullYear() - vehicle.modelYear) * 0.06);
    const mileageFactor =
      vehicle.mileage && vehicle.mileage > 0
        ? Math.max(0.7, 1 - vehicle.mileage / 200_000)
        : 1;

    return Math.round(55_000 * yearFactor * mileageFactor);
  }

  private currentReferenceMonth() {
    const now = new Date();
    return `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  }
}
