import { Injectable } from '@nestjs/common';
import { DomainException } from '../../domain/exceptions/domain.exception';
import { CreateCatalogItemDto } from './dto/create-catalog-item.dto';
import { UpdateCatalogItemDto } from './dto/update-catalog-item.dto';
import { CreateStatusConfigDto } from './dto/create-status-config.dto';
import { UpdateStatusConfigDto } from './dto/update-status-config.dto';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import { ConfigCatalogRepository } from './repositories/config-catalog.repository';

@Injectable()
export class ConfigCatalogService {
  constructor(private readonly repository: ConfigCatalogRepository) {}

  // --- Vehicle types ---
  listVehicleTypes(activeOnly?: boolean) {
    return this.repository.findVehicleTypes(activeOnly);
  }

  async createVehicleType(dto: CreateCatalogItemDto) {
    try {
      return await this.repository.createVehicleType({
        name: dto.name,
        code: dto.code.toLowerCase(),
        sortOrder: dto.sortOrder ?? 0,
        active: dto.active ?? true,
      });
    } catch {
      throw new DomainException('CODE_ALREADY_EXISTS', 'Código já cadastrado', 409);
    }
  }

  async updateVehicleType(id: string, dto: UpdateCatalogItemDto) {
    await this.assertVehicleType(id);
    return this.repository.updateVehicleType(id, {
      ...dto,
      code: dto.code?.toLowerCase(),
    });
  }

  async deactivateVehicleType(id: string) {
    await this.assertVehicleType(id);
    return this.repository.updateVehicleType(id, { active: false });
  }

  // --- Cost types ---
  listCostTypes(activeOnly?: boolean) {
    return this.repository.findCostTypes(activeOnly);
  }

  async createCostType(dto: CreateCatalogItemDto) {
    try {
      return await this.repository.createCostType({
        name: dto.name,
        code: dto.code.toLowerCase(),
        sortOrder: dto.sortOrder ?? 0,
        active: dto.active ?? true,
      });
    } catch {
      throw new DomainException('CODE_ALREADY_EXISTS', 'Código já cadastrado', 409);
    }
  }

  async updateCostType(id: string, dto: UpdateCatalogItemDto) {
    await this.assertCostType(id);
    return this.repository.updateCostType(id, {
      ...dto,
      code: dto.code?.toLowerCase(),
    });
  }

  async deactivateCostType(id: string) {
    await this.assertCostType(id);
    return this.repository.updateCostType(id, { active: false });
  }

  // --- Payment methods ---
  listPaymentMethods(activeOnly?: boolean) {
    return this.repository.findPaymentMethods(activeOnly);
  }

  async createPaymentMethod(dto: CreateCatalogItemDto) {
    try {
      return await this.repository.createPaymentMethod({
        name: dto.name,
        code: dto.code.toLowerCase(),
        sortOrder: dto.sortOrder ?? 0,
        active: dto.active ?? true,
      });
    } catch {
      throw new DomainException('CODE_ALREADY_EXISTS', 'Código já cadastrado', 409);
    }
  }

  async updatePaymentMethod(id: string, dto: UpdateCatalogItemDto) {
    await this.assertPaymentMethod(id);
    return this.repository.updatePaymentMethod(id, {
      ...dto,
      code: dto.code?.toLowerCase(),
    });
  }

  async deactivatePaymentMethod(id: string) {
    await this.assertPaymentMethod(id);
    return this.repository.updatePaymentMethod(id, { active: false });
  }

  // --- Statuses ---
  listStatuses(entity?: string, activeOnly?: boolean) {
    return this.repository.findStatuses(entity, activeOnly);
  }

  async createStatus(dto: CreateStatusConfigDto) {
    try {
      return await this.repository.createStatus({
        entity: dto.entity.toLowerCase(),
        name: dto.name,
        code: dto.code.toLowerCase(),
        color: dto.color,
        sortOrder: dto.sortOrder ?? 0,
        active: dto.active ?? true,
      });
    } catch {
      throw new DomainException('CODE_ALREADY_EXISTS', 'Código já cadastrado para esta entidade', 409);
    }
  }

  async updateStatus(id: string, dto: UpdateStatusConfigDto) {
    await this.assertStatus(id);
    return this.repository.updateStatus(id, {
      ...dto,
      entity: dto.entity?.toLowerCase(),
      code: dto.code?.toLowerCase(),
    });
  }

  async deactivateStatus(id: string) {
    await this.assertStatus(id);
    return this.repository.updateStatus(id, { active: false });
  }

  // --- Email templates ---
  listEmailTemplates(activeOnly?: boolean) {
    return this.repository.findEmailTemplates(activeOnly);
  }

  async createEmailTemplate(dto: CreateEmailTemplateDto) {
    try {
      return await this.repository.createEmailTemplate({
        code: dto.code.toLowerCase(),
        subject: dto.subject,
        bodyHtml: dto.bodyHtml,
        active: dto.active ?? true,
      });
    } catch {
      throw new DomainException('CODE_ALREADY_EXISTS', 'Código já cadastrado', 409);
    }
  }

  async updateEmailTemplate(id: string, dto: UpdateEmailTemplateDto) {
    await this.assertEmailTemplate(id);
    return this.repository.updateEmailTemplate(id, {
      ...dto,
      code: dto.code?.toLowerCase(),
    });
  }

  async deactivateEmailTemplate(id: string) {
    await this.assertEmailTemplate(id);
    return this.repository.updateEmailTemplate(id, { active: false });
  }

  private async assertVehicleType(id: string) {
    if (!(await this.repository.findVehicleTypeById(id))) {
      throw new DomainException('NOT_FOUND', 'Tipo de veículo não encontrado', 404);
    }
  }

  private async assertCostType(id: string) {
    if (!(await this.repository.findCostTypeById(id))) {
      throw new DomainException('NOT_FOUND', 'Tipo de custo não encontrado', 404);
    }
  }

  private async assertPaymentMethod(id: string) {
    if (!(await this.repository.findPaymentMethodById(id))) {
      throw new DomainException('NOT_FOUND', 'Forma de pagamento não encontrada', 404);
    }
  }

  private async assertStatus(id: string) {
    if (!(await this.repository.findStatusById(id))) {
      throw new DomainException('NOT_FOUND', 'Status não encontrado', 404);
    }
  }

  private async assertEmailTemplate(id: string) {
    if (!(await this.repository.findEmailTemplateById(id))) {
      throw new DomainException('NOT_FOUND', 'Template não encontrado', 404);
    }
  }
}
