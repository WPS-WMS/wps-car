import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { ExportReportQueryDto, ReportFormat } from './dto/export-report-query.dto';
import { GeneralReportQueryDto } from './dto/general-report-query.dto';
import { ReportsRepository } from './reports.repository';
import { ExcelReportBuilder } from './services/excel-report.builder';
import { PdfReportBuilder } from './services/pdf-report.builder';
import type { ReportFile } from './types/report-export.types';

@Injectable()
export class ReportsService {
  constructor(
    private readonly repository: ReportsRepository,
    private readonly excelBuilder: ExcelReportBuilder,
    private readonly pdfBuilder: PdfReportBuilder,
  ) {}

  async getGeneralReport(query: GeneralReportQueryDto) {
    return this.repository.getGeneralReport(query);
  }

  async exportStock(query: ExportReportQueryDto): Promise<ReportFile> {
    const tenantName = await this.repository.getTenantName();
    const rows = await this.repository.getStockRows();
    const stamp = this.fileStamp();

    if (query.format === ReportFormat.XLSX) {
      const buffer = await this.excelBuilder.buildStock(tenantName, rows);
      return {
        buffer,
        filename: `estoque-${stamp}.xlsx`,
        mimeType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    }

    const buffer = await this.pdfBuilder.buildStock(tenantName, rows);
    return {
      buffer,
      filename: `estoque-${stamp}.pdf`,
      mimeType: 'application/pdf',
    };
  }

  async exportSales(
    query: ExportReportQueryDto,
    actor: AuthenticatedUser,
  ): Promise<ReportFile> {
    const tenantName = await this.repository.getTenantName();
    const sellerId = actor.role === UserRole.SELLER ? actor.id : undefined;
    const rows = await this.repository.getSalesRows(query, sellerId);
    const periodLabel = this.periodLabel(query.startDate, query.endDate);
    const stamp = this.fileStamp();

    if (query.format === ReportFormat.XLSX) {
      const buffer = await this.excelBuilder.buildSales(tenantName, rows, periodLabel);
      return {
        buffer,
        filename: `vendas-${stamp}.xlsx`,
        mimeType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    }

    const buffer = await this.pdfBuilder.buildSales(tenantName, rows, periodLabel);
    return {
      buffer,
      filename: `vendas-${stamp}.pdf`,
      mimeType: 'application/pdf',
    };
  }

  async exportSummary(query: ExportReportQueryDto): Promise<ReportFile> {
    const tenantName = await this.repository.getTenantName();
    const data = await this.repository.getSummaryData(query.startDate, query.endDate);
    const stamp = this.fileStamp();

    if (query.format === ReportFormat.XLSX) {
      const buffer = await this.excelBuilder.buildSummary(tenantName, data);
      return {
        buffer,
        filename: `resumo-gerencial-${stamp}.xlsx`,
        mimeType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    }

    const buffer = await this.pdfBuilder.buildSummary(tenantName, data);
    return {
      buffer,
      filename: `resumo-gerencial-${stamp}.pdf`,
      mimeType: 'application/pdf',
    };
  }

  private fileStamp() {
    return new Date().toISOString().slice(0, 10);
  }

  private periodLabel(startDate?: Date, endDate?: Date) {
    const fmt = (d: Date) => d.toLocaleDateString('pt-BR');
    if (startDate && endDate) return `Período: ${fmt(startDate)} a ${fmt(endDate)}`;
    if (startDate) return `Período: a partir de ${fmt(startDate)}`;
    if (endDate) return `Período: até ${fmt(endDate)}`;
    return 'Período: todos os registros';
  }
}
