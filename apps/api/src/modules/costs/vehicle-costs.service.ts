import { Injectable } from '@nestjs/common';
import { AttachmentEntityType } from '@prisma/client';
import { DomainException } from '../../domain/exceptions/domain.exception';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import {
  toFinancialResultSummary,
  toVehicleCostResponse,
} from '../../common/mappers/financial.mapper';
import { toAttachmentResponse } from '../../common/mappers/attachment.mapper';
import { TenantContextService } from '../../infrastructure/tenant/tenant-context.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { AttachmentsRepository } from '../../infrastructure/storage/attachments.repository';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { FinancialRecalculationService } from '../financial/services/financial-recalculation.service';
import { CreateVehicleCostDto } from './dto/create-vehicle-cost.dto';
import { UpdateVehicleCostDto } from './dto/update-vehicle-cost.dto';
import { ListVehicleCostsQueryDto } from './dto/list-vehicle-costs-query.dto';
import { VehicleCostsRepository } from './repositories/vehicle-costs.repository';

const RECEIPT_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

@Injectable()
export class VehicleCostsService {
  constructor(
    private readonly costsRepository: VehicleCostsRepository,
    private readonly attachmentsRepository: AttachmentsRepository,
    private readonly storage: StorageService,
    private readonly recalculationService: FinancialRecalculationService,
    private readonly tenantContext: TenantContextService,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(vehicleId: string, query: ListVehicleCostsQueryDto) {
    await this.assertVehicle(vehicleId);

    const { data, total, page, limit } =
      await this.costsRepository.findManyByVehicle(vehicleId, query);

    const receipts = await this.attachmentsRepository.findManyByEntities(
      AttachmentEntityType.VEHICLE_COST,
      data.map((c) => c.id),
    );
    const receiptByCostId = new Map(receipts.map((r) => [r.entityId, r]));

    return new PaginatedResponseDto(
      data.map((cost) => toVehicleCostResponse(cost, receiptByCostId.get(cost.id))),
      total,
      page,
      limit,
    );
  }

  async findById(vehicleId: string, costId: string) {
    await this.assertVehicle(vehicleId);
    const cost = await this.costsRepository.findById(costId, vehicleId);
    if (!cost) {
      throw new DomainException('COST_NOT_FOUND', 'Custo não encontrado', 404);
    }
    const receipt = await this.attachmentsRepository.findByEntity(
      AttachmentEntityType.VEHICLE_COST,
      costId,
    );
    return toVehicleCostResponse(cost, receipt);
  }

  async create(vehicleId: string, dto: CreateVehicleCostDto, actor: AuthenticatedUser) {
    await this.assertVehicle(vehicleId);
    if (dto.supplierId) await this.assertSupplier(dto.supplierId);
    if (dto.responsibleId) await this.assertResponsible(dto.responsibleId);

    const cost = await this.costsRepository.create({
      tenantId: this.tenantContext.requireTenantId(),
      vehicleId,
      type: dto.type,
      description: dto.description,
      amount: dto.amount,
      costDate: dto.costDate,
      supplierId: dto.supplierId,
      responsibleId: dto.responsibleId ?? actor.id,
      createdById: actor.id,
      updatedById: actor.id,
    });

    const financial = await this.recalculationService.recalculate(vehicleId);

    return {
      cost: toVehicleCostResponse(cost, null),
      financialResult: financial ? toFinancialResultSummary(financial) : null,
    };
  }

  async update(
    vehicleId: string,
    costId: string,
    dto: UpdateVehicleCostDto,
    actor: AuthenticatedUser,
  ) {
    const cost = await this.costsRepository.findById(costId, vehicleId);
    if (!cost) {
      throw new DomainException('COST_NOT_FOUND', 'Custo não encontrado', 404);
    }

    if (dto.supplierId) await this.assertSupplier(dto.supplierId);
    if (dto.responsibleId) await this.assertResponsible(dto.responsibleId);

    const updated = await this.costsRepository.update(costId, {
      type: dto.type,
      description: dto.description,
      amount: dto.amount,
      costDate: dto.costDate,
      supplierId: dto.supplierId,
      responsibleId: dto.responsibleId,
      updatedById: actor.id,
    });

    const receipt = await this.attachmentsRepository.findByEntity(
      AttachmentEntityType.VEHICLE_COST,
      costId,
    );

    const financial = await this.recalculationService.recalculate(vehicleId);

    return {
      cost: toVehicleCostResponse(updated, receipt),
      financialResult: financial ? toFinancialResultSummary(financial) : null,
    };
  }

  async remove(vehicleId: string, costId: string) {
    const cost = await this.costsRepository.findById(costId, vehicleId);
    if (!cost) {
      throw new DomainException('COST_NOT_FOUND', 'Custo não encontrado', 404);
    }

    await this.deleteReceiptFiles(costId);
    await this.costsRepository.delete(costId);
    const financial = await this.recalculationService.recalculate(vehicleId);

    return {
      message: 'Custo removido',
      financialResult: financial ? toFinancialResultSummary(financial) : null,
    };
  }

  async uploadReceipt(vehicleId: string, costId: string, file: Express.Multer.File) {
    await this.assertVehicle(vehicleId);
    const cost = await this.costsRepository.findById(costId, vehicleId);
    if (!cost) {
      throw new DomainException('COST_NOT_FOUND', 'Custo não encontrado', 404);
    }

    if (!file) {
      throw new DomainException('FILE_REQUIRED', 'Arquivo é obrigatório', 400);
    }

    if (!RECEIPT_MIMES.includes(file.mimetype)) {
      throw new DomainException(
        'INVALID_FILE_TYPE',
        'Formato permitido: PDF, JPEG, PNG ou WebP',
        400,
      );
    }

    await this.deleteReceiptFiles(costId);

    const tenantId = this.tenantContext.requireTenantId();
    const saved = await this.storage.saveVehicleCostReceipt(tenantId, costId, file);

    const attachment = await this.attachmentsRepository.create({
      tenantId,
      entityType: AttachmentEntityType.VEHICLE_COST,
      entityId: costId,
      fileName: saved.fileName,
      filePath: saved.filePath,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    });

    return toAttachmentResponse(attachment);
  }

  async removeReceipt(vehicleId: string, costId: string) {
    await this.assertVehicle(vehicleId);
    const cost = await this.costsRepository.findById(costId, vehicleId);
    if (!cost) {
      throw new DomainException('COST_NOT_FOUND', 'Custo não encontrado', 404);
    }

    await this.deleteReceiptFiles(costId);
    return { message: 'Comprovante removido' };
  }

  private async deleteReceiptFiles(costId: string) {
    const existing = await this.attachmentsRepository.findManyByEntities(
      AttachmentEntityType.VEHICLE_COST,
      [costId],
    );

    for (const item of existing) {
      await this.storage.deleteFile(item.filePath);
    }

    await this.attachmentsRepository.deleteByEntity(
      AttachmentEntityType.VEHICLE_COST,
      costId,
    );
  }

  private async assertVehicle(vehicleId: string) {
    const vehicle = await this.costsRepository.assertVehicle(vehicleId);
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

  private async assertResponsible(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId: this.tenantContext.requireTenantId(), active: true },
    });
    if (!user) {
      throw new DomainException('USER_NOT_FOUND', 'Responsável não encontrado', 400);
    }
  }
}
