import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import type {
  SalesReportRow,
  StockReportRow,
  SummaryReportData,
} from '../types/report-export.types';

@Injectable()
export class ExcelReportBuilder {
  private currencyFmt = '#,##0.00';

  async buildStock(tenantName: string, rows: StockReportRow[]) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'WPS Car';
    const sheet = workbook.addWorksheet('Estoque');

    sheet.mergeCells('A1:J1');
    sheet.getCell('A1').value = `Estoque — ${tenantName}`;
    sheet.getCell('A1').font = { bold: true, size: 14 };

    sheet.addRow([]);
    const header = sheet.addRow([
      'Placa',
      'Marca',
      'Modelo',
      'Versão',
      'Ano',
      'Compra (R$)',
      'Custos (R$)',
      'Anunciado (R$)',
      'Margem prev. (R$)',
      'Dias',
      'Status',
    ]);
    header.font = { bold: true };

    for (const row of rows) {
      sheet.addRow([
        row.licensePlate,
        row.brand,
        row.model,
        row.version,
        row.year,
        row.purchaseValue,
        row.totalCosts,
        row.listedValue,
        row.expectedMargin,
        row.daysInStock,
        row.status,
      ]);
    }

    this.styleCurrencyColumns(sheet, [6, 7, 8, 9]);
    sheet.columns.forEach((col) => {
      col.width = 14;
    });

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  async buildSales(tenantName: string, rows: SalesReportRow[], periodLabel: string) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Vendas');

    sheet.mergeCells('A1:I1');
    sheet.getCell('A1').value = `Vendas — ${tenantName}`;
    sheet.getCell('A1').font = { bold: true, size: 14 };
    sheet.getCell('A2').value = periodLabel;

    sheet.addRow([]);
    const header = sheet.addRow([
      'Data',
      'Veículo',
      'Placa',
      'Cliente',
      'Vendedor',
      'Valor (R$)',
      'Pagamento',
      'Status',
      'Comissão (R$)',
    ]);
    header.font = { bold: true };

    for (const row of rows) {
      sheet.addRow([
        row.saleDate,
        row.vehicle,
        row.licensePlate,
        row.customer,
        row.seller,
        row.amount,
        row.paymentMethod,
        row.status,
        row.commission,
      ]);
    }

    this.styleCurrencyColumns(sheet, [6, 9]);
    sheet.columns.forEach((col) => {
      col.width = 16;
    });

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  async buildSummary(tenantName: string, data: SummaryReportData) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Resumo');

    sheet.getCell('A1').value = `Resumo gerencial — ${tenantName}`;
    sheet.getCell('A1').font = { bold: true, size: 14 };
    sheet.getCell('A2').value = data.periodLabel;

    sheet.addRow([]);
    sheet.addRow(['Estoque', '']).font = { bold: true };
    sheet.addRow(['Veículos em estoque', data.stock.totalStock]);
    sheet.addRow(['Investimento total (R$)', data.stock.totalInvestment]);
    sheet.addRow(['Custos acumulados (R$)', data.stock.totalCosts]);
    sheet.addRow(['Valor anunciado (R$)', data.stock.totalListedValue]);

    sheet.addRow([]);
    sheet.addRow(['Vendas no período', '']).font = { bold: true };
    sheet.addRow(['Quantidade de vendas', data.sales.salesCount]);
    sheet.addRow(['Receita total (R$)', data.sales.totalRevenue]);
    sheet.addRow(['Lucro total (R$)', data.sales.totalProfit]);
    sheet.addRow(['Ticket médio (R$)', data.sales.averageTicket]);
    sheet.addRow(['Média dias em estoque', data.sales.averageDaysInStock]);
    sheet.addRow(['Comissões (R$)', data.sales.totalCommission]);

    sheet.addRow([]);
    const rankHeader = sheet.addRow([
      '#',
      'Vendedor',
      'Vendas',
      'Receita (R$)',
      'Comissão (R$)',
    ]);
    rankHeader.font = { bold: true };

    for (const row of data.ranking) {
      sheet.addRow([
        row.position,
        row.sellerName,
        row.salesCount,
        row.totalRevenue,
        row.totalCommission,
      ]);
    }

    this.styleCurrencyColumns(sheet, [2], 4, 10);
    sheet.getColumn(1).width = 28;
    sheet.getColumn(2).width = 22;

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  private styleCurrencyColumns(
    sheet: ExcelJS.Worksheet,
    columns: number[],
    startRow = 4,
    endRow?: number,
  ) {
    const lastRow = endRow ?? sheet.rowCount;
    for (let r = startRow; r <= lastRow; r++) {
      for (const c of columns) {
        const cell = sheet.getRow(r).getCell(c);
        if (typeof cell.value === 'number') {
          cell.numFmt = this.currencyFmt;
        }
      }
    }
  }
}
