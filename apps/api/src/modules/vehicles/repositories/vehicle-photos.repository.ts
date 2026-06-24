import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { TenantContextService } from '../../../infrastructure/tenant/tenant-context.service';

@Injectable()
export class VehiclePhotosRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async findByVehicle(vehicleId: string) {
    return this.prisma.vehiclePhoto.findMany({
      where: {
        vehicleId,
        tenantId: this.tenantContext.requireTenantId(),
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findById(photoId: string, vehicleId: string) {
    return this.prisma.vehiclePhoto.findFirst({
      where: {
        id: photoId,
        vehicleId,
        tenantId: this.tenantContext.requireTenantId(),
      },
    });
  }

  async create(data: {
    tenantId: string;
    vehicleId: string;
    fileName: string;
    filePath: string;
    thumbnailPath?: string | null;
    mimeType?: string;
    sizeBytes?: number;
    sortOrder?: number;
    isPrimary?: boolean;
  }) {
    return this.prisma.vehiclePhoto.create({ data });
  }

  async clearPrimary(vehicleId: string) {
    return this.prisma.vehiclePhoto.updateMany({
      where: { vehicleId, tenantId: this.tenantContext.requireTenantId() },
      data: { isPrimary: false },
    });
  }

  async setPrimary(photoId: string, vehicleId: string) {
    const tenantId = this.tenantContext.requireTenantId();
    return this.prisma.$transaction([
      this.prisma.vehiclePhoto.updateMany({
        where: { vehicleId, tenantId },
        data: { isPrimary: false },
      }),
      this.prisma.vehiclePhoto.update({
        where: { id: photoId },
        data: { isPrimary: true },
      }),
    ]);
  }

  async delete(photoId: string) {
    return this.prisma.vehiclePhoto.delete({ where: { id: photoId } });
  }

  async countByVehicle(vehicleId: string) {
    return this.prisma.vehiclePhoto.count({
      where: { vehicleId, tenantId: this.tenantContext.requireTenantId() },
    });
  }
}
