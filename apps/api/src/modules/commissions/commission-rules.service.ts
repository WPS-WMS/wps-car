import { Injectable } from '@nestjs/common';
import { DomainException } from '../../domain/exceptions/domain.exception';
import {
  toCommissionRuleResponse,
  toVehicleCommissionOverrideResponse,
} from '../../common/mappers/commission.mapper';
import { TenantContextService } from '../../infrastructure/tenant/tenant-context.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { FinancialRecalculationService } from '../financial/services/financial-recalculation.service';
import { CreateCommissionRuleDto } from './dto/create-commission-rule.dto';
import { UpdateCommissionRuleDto } from './dto/update-commission-rule.dto';
import { UpsertVehicleCommissionDto } from './dto/upsert-vehicle-commission.dto';
import { CommissionRulesRepository } from './repositories/commission-rules.repository';

@Injectable()
export class CommissionRulesService {
  constructor(
    private readonly repository: CommissionRulesRepository,
    private readonly tenantContext: TenantContextService,
    private readonly prisma: PrismaService,
    private readonly recalculationService: FinancialRecalculationService,
  ) {}

  async findAll(activeOnly?: boolean) {
    const rules = await this.repository.findAll(activeOnly);
    return rules.map(toCommissionRuleResponse);
  }

  async findById(id: string) {
    const rule = await this.repository.findById(id);
    if (!rule) {
      throw new DomainException('COMMISSION_RULE_NOT_FOUND', 'Regra não encontrada', 404);
    }
    return toCommissionRuleResponse(rule);
  }

  async create(dto: CreateCommissionRuleDto) {
    const tenantId = this.tenantContext.requireTenantId();

    const rule = await this.repository.create({
      tenantId,
      name: dto.name,
      type: dto.type,
      value: dto.value,
      active: dto.active ?? true,
      isDefault: dto.isDefault ?? false,
    });

    if (rule.isDefault) {
      await this.repository.clearOtherDefaults(rule.id);
    }

    return toCommissionRuleResponse(rule);
  }

  async update(id: string, dto: UpdateCommissionRuleDto) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new DomainException('COMMISSION_RULE_NOT_FOUND', 'Regra não encontrada', 404);
    }

    const rule = await this.repository.update(id, {
      name: dto.name,
      type: dto.type,
      value: dto.value,
      active: dto.active,
      isDefault: dto.isDefault,
    });

    if (dto.isDefault) {
      await this.repository.clearOtherDefaults(rule.id);
    }

    return toCommissionRuleResponse(rule);
  }

  async deactivate(id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new DomainException('COMMISSION_RULE_NOT_FOUND', 'Regra não encontrada', 404);
    }

    if (existing.isDefault) {
      throw new DomainException(
        'CANNOT_DEACTIVATE_DEFAULT',
        'Não é possível inativar a regra padrão. Defina outra como padrão primeiro.',
        403,
      );
    }

    const rule = await this.repository.update(id, { active: false, isDefault: false });
    return toCommissionRuleResponse(rule);
  }

  async getVehicleOverride(vehicleId: string) {
    await this.assertVehicle(vehicleId);
    const override = await this.repository.findVehicleOverride(vehicleId);
    if (!override) {
      return null;
    }
    return toVehicleCommissionOverrideResponse(override);
  }

  async upsertVehicleOverride(vehicleId: string, dto: UpsertVehicleCommissionDto) {
    await this.assertVehicle(vehicleId);

    const override = await this.repository.upsertVehicleOverride(vehicleId, {
      type: dto.type,
      value: dto.value,
    });

    await this.recalculationService.recalculate(vehicleId);

    return toVehicleCommissionOverrideResponse(override);
  }

  async removeVehicleOverride(vehicleId: string) {
    await this.assertVehicle(vehicleId);
    await this.repository.deleteVehicleOverride(vehicleId);
    await this.recalculationService.recalculate(vehicleId);
    return { message: 'Override de comissão removido' };
  }

  private async assertVehicle(vehicleId: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, tenantId: this.tenantContext.requireTenantId() },
    });
    if (!vehicle) {
      throw new DomainException('VEHICLE_NOT_FOUND', 'Veículo não encontrado', 404);
    }
  }
}
