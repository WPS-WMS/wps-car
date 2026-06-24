import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DashboardsModule } from '../dashboards/dashboards.module';
import { ReportsController } from './reports.controller';
import { ExportJobsRepository } from './export-jobs.repository';
import { ExportJobsService } from './export-jobs.service';
import { ReportsRepository } from './reports.repository';
import { ReportsService } from './reports.service';
import { ExportJobRunnerService } from './services/export-job.runner.service';
import { ExportCleanupService } from './services/export-cleanup.service';
import { ExportQueueService } from './services/export-queue.service';
import { ExcelReportBuilder } from './services/excel-report.builder';
import { PdfReportBuilder } from './services/pdf-report.builder';

@Module({
  imports: [DashboardsModule, AuthModule],
  controllers: [ReportsController],
  providers: [
    ReportsRepository,
    ReportsService,
    ExportJobsRepository,
    ExportJobsService,
    ExportJobRunnerService,
    ExportCleanupService,
    ExportQueueService,
    ExcelReportBuilder,
    PdfReportBuilder,
  ],
})
export class ReportsModule {}
