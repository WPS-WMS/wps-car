import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ExportJobStatus, ExportJobType, UserRole } from '@prisma/client';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateExportJobDto } from './dto/create-export-job.dto';
import { ExportJobsRepository } from './export-jobs.repository';
import { ExportQueueService } from './services/export-queue.service';

@Injectable()
export class ExportJobsService {
  constructor(
    private readonly repository: ExportJobsRepository,
    private readonly exportQueue: ExportQueueService,
    private readonly storage: StorageService,
  ) {}

  async create(actor: AuthenticatedUser, dto: CreateExportJobDto) {
    if (
      (dto.type === ExportJobType.STOCK || dto.type === ExportJobType.SUMMARY) &&
      actor.role !== UserRole.ADMIN &&
      actor.role !== UserRole.MANAGER
    ) {
      throw new ForbiddenException('Sem permissão para exportar este relatório');
    }

    const job = await this.repository.create(actor.id, dto);
    await this.exportQueue.enqueue(job.id);
    return this.toResponse(job);
  }

  async getStatus(id: string, actor: AuthenticatedUser) {
    const job = await this.repository.requireById(id);
    this.assertCanAccess(job.requestedById, actor);
    return this.toResponse(job);
  }

  async getDownloadFile(id: string, actor: AuthenticatedUser) {
    const job = await this.repository.requireById(id);
    this.assertCanAccess(job.requestedById, actor);

    if (job.status !== ExportJobStatus.COMPLETED || !job.filePath || !job.fileName) {
      throw new NotFoundException('Arquivo de exportação indisponível');
    }

    const buffer = await this.storage.readFile(job.filePath);

    return {
      buffer,
      filename: job.fileName,
      mimeType: job.mimeType ?? 'application/octet-stream',
    };
  }

  private assertCanAccess(requestedById: string, actor: AuthenticatedUser) {
    const isOwner = requestedById === actor.id;
    const isManager = actor.role === 'ADMIN' || actor.role === 'MANAGER';

    if (!isOwner && !isManager) {
      throw new ForbiddenException('Sem permissão para acessar esta exportação');
    }
  }

  private toResponse(job: {
    id: string;
    type: ExportJobType;
    format: string;
    status: ExportJobStatus;
    fileName: string | null;
    errorMessage: string | null;
    createdAt: Date;
    completedAt: Date | null;
  }) {
    return {
      id: job.id,
      type: job.type,
      format: job.format,
      status: job.status,
      fileName: job.fileName,
      errorMessage: job.errorMessage,
      createdAt: job.createdAt.toISOString(),
      completedAt: job.completedAt?.toISOString() ?? null,
    };
  }
}
