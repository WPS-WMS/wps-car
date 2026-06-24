import { Injectable, Logger } from '@nestjs/common';
import { ExportJobStatus, ExportJobType } from '@prisma/client';
import { TenantContextService } from '../../../infrastructure/tenant/tenant-context.service';
import { StorageService } from '../../../infrastructure/storage/storage.service';
import { JwtUserLoaderService } from '../../auth/services/jwt-user-loader.service';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { ExportReportQueryDto, ReportFormat } from '../dto/export-report-query.dto';
import {
  ExportJobsRepository,
  StoredExportParams,
  toExportQuery,
} from '../export-jobs.repository';
import { ReportsService } from '../reports.service';

@Injectable()
export class ExportJobRunnerService {
  private readonly logger = new Logger(ExportJobRunnerService.name);

  constructor(
    private readonly repository: ExportJobsRepository,
    private readonly reportsService: ReportsService,
    private readonly jwtUserLoader: JwtUserLoaderService,
    private readonly tenantContext: TenantContextService,
    private readonly storage: StorageService,
  ) {}

  async run(jobId: string, options: { markFailedOnError?: boolean } = {}) {
    const { markFailedOnError = true } = options;
    const job = await this.repository.findByIdForProcessing(jobId);
    if (
      !job ||
      (job.status !== ExportJobStatus.PENDING &&
        job.status !== ExportJobStatus.PROCESSING)
    ) {
      return;
    }

    try {
      await this.repository.markProcessing(jobId);

      await this.tenantContext.runWithTenant(job.tenantId, job.requestedById, async () => {
        const actor = await this.jwtUserLoader.loadById(job.requestedById);
        if (!actor) {
          throw new Error('Usuário solicitante não encontrado');
        }

        const storedParams = job.params as StoredExportParams;
        const query = this.buildExportQuery(storedParams, job.type);
        const file = await this.generateFile(job.type, query, actor);

        const saved = await this.storage.saveExportBuffer(
          job.tenantId,
          job.id,
          file.buffer,
          file.filename,
          file.mimeType,
        );

        await this.repository.markCompleted(jobId, {
          filePath: saved.filePath,
          fileName: file.filename,
          mimeType: file.mimeType,
        });
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Falha ao gerar exportação';
      this.logger.error(`Export job ${jobId} failed: ${message}`);
      if (markFailedOnError) {
        await this.repository.markFailed(jobId, message);
      }
      throw error;
    }
  }

  private buildExportQuery(
    params: StoredExportParams,
    type: ExportJobType,
  ): ExportReportQueryDto {
    const query = toExportQuery(params, type);
    return {
      format: query.format as ReportFormat,
      branchId: query.branchId,
      sellerId: query.sellerId,
      startDate: query.startDate,
      endDate: query.endDate,
      status: query.status as ExportReportQueryDto['status'],
    };
  }

  private generateFile(
    type: ExportJobType,
    query: ExportReportQueryDto,
    actor: AuthenticatedUser,
  ) {
    switch (type) {
      case ExportJobType.STOCK:
        return this.reportsService.exportStock(query);
      case ExportJobType.SALES:
        return this.reportsService.exportSales(query, actor);
      case ExportJobType.SUMMARY:
        return this.reportsService.exportSummary(actor, query);
      default:
        throw new Error('Tipo de exportação inválido');
    }
  }
}
