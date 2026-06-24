import { Injectable, NotFoundException } from '@nestjs/common';
import { ExportJobStatus, ExportJobType, Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { TenantContextService } from '../../infrastructure/tenant/tenant-context.service';
import { CreateExportJobDto } from './dto/create-export-job.dto';

@Injectable()
export class ExportJobsRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  private tenantId() {
    return this.tenantContext.requireTenantId();
  }

  create(requestedById: string, dto: CreateExportJobDto) {
    const params: Prisma.InputJsonObject = {
      format: dto.format,
      ...(dto.branchId && { branchId: dto.branchId }),
      ...(dto.sellerId && { sellerId: dto.sellerId }),
      ...(dto.startDate && { startDate: dto.startDate.toISOString() }),
      ...(dto.endDate && { endDate: dto.endDate.toISOString() }),
      ...(dto.status && { status: dto.status }),
    };

    return this.prisma.exportJob.create({
      data: {
        tenantId: this.tenantId(),
        requestedById,
        type: dto.type,
        format: dto.format,
        params,
      },
    });
  }

  findById(id: string) {
    return this.prisma.exportJob.findFirst({
      where: { id, tenantId: this.tenantId() },
    });
  }

  async requireById(id: string) {
    const job = await this.findById(id);
    if (!job) {
      throw new NotFoundException('Exportação não encontrada');
    }
    return job;
  }

  findByIdForProcessing(id: string) {
    return this.prisma.exportJob.findUnique({ where: { id } });
  }

  markProcessing(id: string) {
    return this.prisma.exportJob.update({
      where: { id },
      data: { status: ExportJobStatus.PROCESSING },
    });
  }

  markCompleted(
    id: string,
    data: { filePath: string; fileName: string; mimeType: string },
  ) {
    return this.prisma.exportJob.update({
      where: { id },
      data: {
        status: ExportJobStatus.COMPLETED,
        filePath: data.filePath,
        fileName: data.fileName,
        mimeType: data.mimeType,
        completedAt: new Date(),
        errorMessage: null,
      },
    });
  }

  markFailed(id: string, errorMessage: string) {
    return this.prisma.exportJob.update({
      where: { id },
      data: {
        status: ExportJobStatus.FAILED,
        errorMessage,
        completedAt: new Date(),
      },
    });
  }
}

export type StoredExportParams = {
  format: string;
  branchId?: string;
  sellerId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
};

export function toExportQuery(params: StoredExportParams, type: ExportJobType) {
  return {
    format: params.format,
    branchId: params.branchId,
    sellerId: params.sellerId,
    startDate: params.startDate ? new Date(params.startDate) : undefined,
    endDate: params.endDate ? new Date(params.endDate) : undefined,
    status: params.status,
    type,
  };
}
