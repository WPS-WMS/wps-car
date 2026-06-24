import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DomainException } from '../../domain/exceptions/domain.exception';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { VehicleFinancialCalculatorService } from '../../domain/services/vehicle-financial-calculator.service';
import {
  isValidLicensePlate,
  normalizeLicensePlate,
} from '../../common/utils/license-plate.util';
import { toStockItemResponse } from '../../common/mappers/vehicle.mapper';
import { FipeLookupService } from '../../infrastructure/fipe/fipe-lookup.service';
import { DataScopeService } from '../../infrastructure/scope/data-scope.service';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { TENANT_SETTING_DEFAULTS, TENANT_SETTING_KEYS } from '../settings/constants/tenant-setting-keys';
import { TenantSettingsService } from '../settings/tenant-settings.service';
import { VehiclesRepository } from '../vehicles/repositories/vehicles.repository';
import { AnalyzePurchaseDto } from './dto/analyze-purchase.dto';
import { ListPurchaseHistoryQueryDto } from './dto/list-purchase-history-query.dto';
import { toPurchaseIntelligenceQueryResponse } from './purchase-intelligence.mapper';
import { PurchaseIntelligenceRepository } from './repositories/purchase-intelligence.repository';

@Injectable()
export class PurchaseIntelligenceService {
  constructor(
    private readonly repository: PurchaseIntelligenceRepository,
    private readonly vehiclesRepository: VehiclesRepository,
    private readonly fipeLookup: FipeLookupService,
    private readonly calculator: VehicleFinancialCalculatorService,
    private readonly tenantSettings: TenantSettingsService,
    private readonly dataScope: DataScopeService,
  ) {}

  async analyze(dto: AnalyzePurchaseDto, actor: AuthenticatedUser) {
    if (!isValidLicensePlate(dto.licensePlate)) {
      throw new DomainException('INVALID_LICENSE_PLATE', 'Placa inválida', 400);
    }

    const licensePlate = normalizeLicensePlate(dto.licensePlate);
    const defaults = await this.resolveDefaults();
    const desiredMarginPercent =
      dto.desiredMarginPercent ?? defaults.defaultMarginPercent;
    const estimatedCosts = dto.estimatedCosts ?? defaults.estimatedPrepCosts;

    const existingVehicle = await this.vehiclesRepository.findByLicensePlate(licensePlate);
    let existingInStock: ReturnType<typeof toStockItemResponse> | null = null;

    if (existingVehicle) {
      this.dataScope.assertVehicleAccess(existingVehicle, actor);
      existingInStock = toStockItemResponse(existingVehicle);
    }

    const fipeResult = await this.fipeLookup.lookupByPlate(licensePlate);
    const maxPurchaseValue = this.calculator.calculateSuggestedPurchase(
      fipeResult.fipeValue,
      estimatedCosts,
      desiredMarginPercent,
    );
    const marginAmount = fipeResult.fipeValue * (desiredMarginPercent / 100);

    const saved = await this.repository.create({
      licensePlate,
      fipeValue: fipeResult.fipeValue,
      desiredMarginPercent,
      estimatedCosts,
      maxPurchaseValue,
      userId: actor.id,
      rawResponse: {
        provider: fipeResult.provider,
        referenceMonth: fipeResult.referenceMonth,
        fipeVehicle: fipeResult.vehicle,
        existingVehicleId: existingVehicle?.id ?? null,
        existingInStock: existingInStock !== null,
        fipeRaw: fipeResult.raw ?? null,
      } as unknown as Prisma.InputJsonValue,
    });

    return {
      queryId: saved.id,
      licensePlate,
      provider: fipeResult.provider,
      referenceMonth: fipeResult.referenceMonth,
      fipe: {
        value: fipeResult.fipeValue.toFixed(2),
        vehicle: fipeResult.vehicle,
      },
      analysis: {
        desiredMarginPercent,
        marginAmount: marginAmount.toFixed(2),
        estimatedCosts: estimatedCosts.toFixed(2),
        maxPurchaseValue: maxPurchaseValue.toFixed(2),
        formula: 'ValorFIPE - MargemDesejada - CustosEstimados',
      },
      existingInStock,
      defaultsUsed: {
        defaultMarginPercent: defaults.defaultMarginPercent,
        estimatedPrepCosts: defaults.estimatedPrepCosts,
      },
    };
  }

  async listHistory(query: ListPurchaseHistoryQueryDto) {
    const { data, total, page, limit } = await this.repository.findPaginated(query);
    return new PaginatedResponseDto(
      data.map(toPurchaseIntelligenceQueryResponse),
      total,
      page,
      limit,
    );
  }

  private async resolveDefaults() {
    const { settings } = await this.tenantSettings.getAll();
    const defaultMarginPercent = Number(
      settings[TENANT_SETTING_KEYS.DEFAULT_MARGIN_PERCENT] ??
        TENANT_SETTING_DEFAULTS[TENANT_SETTING_KEYS.DEFAULT_MARGIN_PERCENT],
    );
    const estimatedPrepCosts = Number(
      settings[TENANT_SETTING_KEYS.ESTIMATED_PREP_COSTS_DEFAULT] ??
        TENANT_SETTING_DEFAULTS[TENANT_SETTING_KEYS.ESTIMATED_PREP_COSTS_DEFAULT],
    );

    return {
      defaultMarginPercent: Number.isFinite(defaultMarginPercent) ? defaultMarginPercent : 12,
      estimatedPrepCosts: Number.isFinite(estimatedPrepCosts) ? estimatedPrepCosts : 2000,
    };
  }
}
