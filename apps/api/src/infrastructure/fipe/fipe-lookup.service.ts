import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DomainException } from '../../domain/exceptions/domain.exception';
import { normalizeLicensePlate } from '../../common/utils/license-plate.util';
import { FipePlateLookupResult } from './fipe-lookup.types';

const MOCK_CATALOG: Array<{
  brand: string;
  model: string;
  version: string;
  modelYear: number;
  manufactureYear: number;
  fuel: string;
  fipeValue: number;
}> = [
  {
    brand: 'Volkswagen',
    model: 'Gol',
    version: '1.0 MPI',
    modelYear: 2022,
    manufactureYear: 2021,
    fuel: 'FLEX',
    fipeValue: 58900,
  },
  {
    brand: 'Chevrolet',
    model: 'Onix',
    version: '1.0 Turbo',
    modelYear: 2023,
    manufactureYear: 2022,
    fuel: 'FLEX',
    fipeValue: 72400,
  },
  {
    brand: 'Fiat',
    model: 'Argo',
    version: '1.3 Drive',
    modelYear: 2021,
    manufactureYear: 2020,
    fuel: 'FLEX',
    fipeValue: 61200,
  },
  {
    brand: 'Hyundai',
    model: 'HB20',
    version: '1.0 Comfort',
    modelYear: 2022,
    manufactureYear: 2021,
    fuel: 'FLEX',
    fipeValue: 69800,
  },
  {
    brand: 'Toyota',
    model: 'Corolla',
    version: '2.0 GLi',
    modelYear: 2020,
    manufactureYear: 2019,
    fuel: 'FLEX',
    fipeValue: 98500,
  },
  {
    brand: 'Jeep',
    model: 'Compass',
    version: '1.3 Turbo',
    modelYear: 2023,
    manufactureYear: 2022,
    fuel: 'FLEX',
    fipeValue: 142900,
  },
];

@Injectable()
export class FipeLookupService {
  private readonly logger = new Logger(FipeLookupService.name);

  constructor(private readonly config: ConfigService) {}

  async lookupByPlate(licensePlate: string): Promise<FipePlateLookupResult> {
    const normalized = normalizeLicensePlate(licensePlate);
    const provider = this.config.get<string>('fipe.provider') ?? 'mock';

    if (provider === 'http') {
      return this.lookupViaHttp(normalized);
    }

    return this.lookupViaMock(normalized);
  }

  private lookupViaMock(licensePlate: string): FipePlateLookupResult {
    const hash = [...licensePlate].reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const entry = MOCK_CATALOG[hash % MOCK_CATALOG.length]!;
    const plateVariation = (hash % 7) * 850;
    const fipeValue = Math.round(entry.fipeValue + plateVariation);

    return {
      provider: 'mock',
      licensePlate,
      vehicle: {
        brand: entry.brand,
        model: entry.model,
        version: entry.version,
        modelYear: entry.modelYear,
        manufactureYear: entry.manufactureYear,
        fuel: entry.fuel,
        color: hash % 2 === 0 ? 'Prata' : 'Branco',
      },
      fipeValue,
      referenceMonth: this.currentReferenceMonth(),
      raw: { source: 'mock', catalogIndex: hash % MOCK_CATALOG.length },
    };
  }

  private async lookupViaHttp(licensePlate: string): Promise<FipePlateLookupResult> {
    const baseUrl = this.config.get<string>('fipe.httpUrl');
    if (!baseUrl?.trim()) {
      throw new DomainException(
        'FIPE_PROVIDER_NOT_CONFIGURED',
        'FIPE_LOOKUP_HTTP_URL não configurada',
        503,
      );
    }

    const url = baseUrl.replace('{plate}', encodeURIComponent(licensePlate));
    const timeoutMs = this.config.get<number>('fipe.httpTimeoutMs') ?? 8000;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timer);

      if (!response.ok) {
        throw new DomainException(
          'FIPE_LOOKUP_FAILED',
          'Não foi possível consultar a placa na API externa',
          502,
        );
      }

      const payload = (await response.json()) as Record<string, unknown>;
      return this.mapHttpPayload(licensePlate, payload);
    } catch (error) {
      if (error instanceof DomainException) throw error;
      this.logger.warn(`Falha na consulta FIPE HTTP para ${licensePlate}`, error);
      throw new DomainException(
        'FIPE_LOOKUP_FAILED',
        'Falha ao consultar dados da placa',
        502,
      );
    }
  }

  private mapHttpPayload(
    licensePlate: string,
    payload: Record<string, unknown>,
  ): FipePlateLookupResult {
    const brand = String(payload.brand ?? payload.marca ?? '').trim();
    const model = String(payload.model ?? payload.modelo ?? '').trim();
    const modelYear = Number(payload.modelYear ?? payload.anoModelo ?? payload.ano ?? 0);
    const fipeValue = Number(
      payload.fipeValue ?? payload.valor ?? payload.valorFipe ?? payload.preco ?? 0,
    );

    if (!brand || !model || !modelYear || !fipeValue) {
      throw new DomainException(
        'FIPE_LOOKUP_INVALID_RESPONSE',
        'Resposta da API de placa incompleta',
        502,
      );
    }

    return {
      provider: 'http',
      licensePlate,
      vehicle: {
        brand,
        model,
        modelYear,
        manufactureYear: Number(payload.manufactureYear ?? payload.anoFabricacao ?? modelYear),
        version: payload.version ? String(payload.version) : undefined,
        fuel: payload.fuel ? String(payload.fuel) : undefined,
        color: payload.color ? String(payload.color) : undefined,
      },
      fipeValue,
      referenceMonth: payload.referenceMonth ? String(payload.referenceMonth) : undefined,
      raw: payload,
    };
  }

  private currentReferenceMonth() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${month}/${now.getFullYear()}`;
  }
}
