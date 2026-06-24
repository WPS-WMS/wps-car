import { Injectable } from '@nestjs/common';
import { AttachmentEntityType, VehicleDocumentType } from '@prisma/client';
import { DomainException } from '../../domain/exceptions/domain.exception';
import { toAttachmentResponse } from '../../common/mappers/attachment.mapper';
import { AttachmentsRepository } from '../../infrastructure/storage/attachments.repository';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { TenantContextService } from '../../infrastructure/tenant/tenant-context.service';
import { VehiclesRepository } from './repositories/vehicles.repository';

const ALLOWED_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

@Injectable()
export class VehicleDocumentsService {
  constructor(
    private readonly vehiclesRepository: VehiclesRepository,
    private readonly attachmentsRepository: AttachmentsRepository,
    private readonly storage: StorageService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async list(vehicleId: string) {
    await this.assertVehicleExists(vehicleId);

    const attachments = await this.attachmentsRepository.findAllByEntity(
      AttachmentEntityType.VEHICLE,
      vehicleId,
    );

    return attachments.map(toAttachmentResponse);
  }

  async upload(
    vehicleId: string,
    documentType: VehicleDocumentType,
    file: Express.Multer.File,
  ) {
    await this.assertVehicleExists(vehicleId);

    if (!file) {
      throw new DomainException('FILE_REQUIRED', 'Arquivo é obrigatório', 400);
    }

    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      throw new DomainException(
        'INVALID_FILE_TYPE',
        'Formato permitido: PDF, JPEG, PNG ou WebP',
        400,
      );
    }

    const tenantId = this.tenantContext.requireTenantId();
    const saved = await this.storage.saveGenericFile(
      tenantId,
      ['vehicles', vehicleId, 'documents', documentType],
      file,
    );

    const attachment = await this.attachmentsRepository.create({
      tenantId,
      entityType: AttachmentEntityType.VEHICLE,
      entityId: vehicleId,
      documentType,
      fileName: saved.fileName,
      filePath: saved.filePath,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    });

    return toAttachmentResponse(attachment);
  }

  async remove(vehicleId: string, documentId: string) {
    await this.assertVehicleExists(vehicleId);

    const attachment = await this.attachmentsRepository.findById(documentId);
    if (
      !attachment ||
      attachment.entityType !== AttachmentEntityType.VEHICLE ||
      attachment.entityId !== vehicleId
    ) {
      throw new DomainException('DOCUMENT_NOT_FOUND', 'Documento não encontrado', 404);
    }

    await this.storage.deleteFile(attachment.filePath);
    await this.attachmentsRepository.delete(documentId);

    return { message: 'Documento removido' };
  }

  private async assertVehicleExists(vehicleId: string) {
    const vehicle = await this.vehiclesRepository.findById(vehicleId);
    if (!vehicle) {
      throw new DomainException('VEHICLE_NOT_FOUND', 'Veículo não encontrado', 404);
    }
  }
}
