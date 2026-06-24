import { Injectable } from '@nestjs/common';
import { DomainException } from '../../domain/exceptions/domain.exception';
import { toPhotoResponse } from '../../common/mappers/vehicle.mapper';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { TenantContextService } from '../../infrastructure/tenant/tenant-context.service';
import { VehiclesRepository } from './repositories/vehicles.repository';
import { VehiclePhotosRepository } from './repositories/vehicle-photos.repository';

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_PHOTOS_PER_VEHICLE = 10;

@Injectable()
export class VehiclePhotosService {
  constructor(
    private readonly vehiclesRepository: VehiclesRepository,
    private readonly photosRepository: VehiclePhotosRepository,
    private readonly storage: StorageService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async list(vehicleId: string) {
    await this.assertVehicleExists(vehicleId);
    const photos = await this.photosRepository.findByVehicle(vehicleId);
    return photos.map(toPhotoResponse);
  }

  async upload(vehicleId: string, file: Express.Multer.File) {
    await this.assertVehicleExists(vehicleId);

    if (!file) {
      throw new DomainException('FILE_REQUIRED', 'Arquivo é obrigatório', 400);
    }

    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      throw new DomainException(
        'INVALID_FILE_TYPE',
        'Formato permitido: JPEG, PNG ou WebP',
        400,
      );
    }

    const count = await this.photosRepository.countByVehicle(vehicleId);
    if (count >= MAX_PHOTOS_PER_VEHICLE) {
      throw new DomainException(
        'PHOTO_LIMIT_REACHED',
        `Limite de ${MAX_PHOTOS_PER_VEHICLE} fotos por veículo`,
        400,
      );
    }

    const tenantId = this.tenantContext.requireTenantId();
    const saved = await this.storage.saveVehiclePhoto(tenantId, vehicleId, file);

    const photo = await this.photosRepository.create({
      tenantId,
      vehicleId,
      fileName: saved.fileName,
      filePath: saved.filePath,
      thumbnailPath: saved.thumbnailPath,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      sortOrder: count,
      isPrimary: count === 0,
    });

    return toPhotoResponse(photo);
  }

  async setPrimary(vehicleId: string, photoId: string) {
    await this.assertVehicleExists(vehicleId);
    const photo = await this.photosRepository.findById(photoId, vehicleId);
    if (!photo) {
      throw new DomainException('PHOTO_NOT_FOUND', 'Foto não encontrada', 404);
    }

    await this.photosRepository.setPrimary(photoId, vehicleId);
    const updated = await this.photosRepository.findById(photoId, vehicleId);
    return toPhotoResponse(updated!);
  }

  async remove(vehicleId: string, photoId: string) {
    await this.assertVehicleExists(vehicleId);
    const photo = await this.photosRepository.findById(photoId, vehicleId);
    if (!photo) {
      throw new DomainException('PHOTO_NOT_FOUND', 'Foto não encontrada', 404);
    }

    await this.storage.deleteFiles([photo.filePath, photo.thumbnailPath]);
    await this.photosRepository.delete(photoId);

    if (photo.isPrimary) {
      const remaining = await this.photosRepository.findByVehicle(vehicleId);
      if (remaining.length > 0) {
        await this.photosRepository.setPrimary(remaining[0].id, vehicleId);
      }
    }

    return { message: 'Foto removida' };
  }

  private async assertVehicleExists(vehicleId: string) {
    const vehicle = await this.vehiclesRepository.findById(vehicleId);
    if (!vehicle) {
      throw new DomainException('VEHICLE_NOT_FOUND', 'Veículo não encontrado', 404);
    }
  }
}
