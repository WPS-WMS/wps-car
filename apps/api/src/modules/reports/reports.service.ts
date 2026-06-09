import { Injectable } from '@nestjs/common';
import { DataScopeService } from '../../infrastructure/scope/data-scope.service';
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
    private readonly dataScope: DataScopeService,
  ) {}

  async getGeneralReport(actor: AuthenticatedUser, query: GeneralReportQueryDto) {
    const saleScope = await this.dataScope.buildSaleScope(actor, {
      branchId: query.branchId,
      sellerId: query.sellerId,
    });
    return this.repository.getGeneralReport(query, saleScope);
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
    const saleScope = await this.dataScope.buildSaleScope(actor, {
      branchId: query.branchId,
      sellerId: query.sellerId,
    });
    const rows = await this.repository.getSalesRows(query, saleScope);
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

  async exportSummary(
    actor: AuthenticatedUser,
    query: ExportReportQueryDto,
  ): Promise<ReportFile> {
    const tenantName = await this.repository.getTenantName();
    const saleScope = await this.dataScope.buildSaleScope(actor, {
      branchId: query.branchId,
      sellerId: query.sellerId,
    });
    const data = await this.repository.getSummaryData(
      query.startDate,
      query.endDate,
      saleScope,
    );
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
