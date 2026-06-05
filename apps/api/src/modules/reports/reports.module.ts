import { Module } from '@nestjs/common';
import { DashboardsModule } from '../dashboards/dashboards.module';
import { ReportsController } from './reports.controller';
import { ReportsRepository } from './reports.repository';
import { ReportsService } from './reports.service';
import { ExcelReportBuilder } from './services/excel-report.builder';
import { PdfReportBuilder } from './services/pdf-report.builder';

@Module({
  imports: [DashboardsModule],
  controllers: [ReportsController],
  providers: [
    ReportsRepository,
    ReportsService,
    ExcelReportBuilder,
    PdfReportBuilder,
  ],
})
export class ReportsModule {}
