import { Injectable } from '@nestjs/common';
import type { SalesReportRow, StockReportRow, SummaryReportData } from '../types/report-export.types';

// pdfmake 0.3.x — API diferente da 0.2 (singleton, não é construtor)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfmake = require('pdfmake') as {
  addFonts: (fonts: Record<string, unknown>) => void;
  createPdf: (doc: object) => { getBuffer: () => Promise<Buffer> };
  virtualfs: { writeFileSync: (name: string, content: Buffer) => void };
};
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Roboto = require('pdfmake/js/browser-extensions/fonts/Roboto') as {
  vfs: Record<string, { data: string; encoding?: string }>;
  fonts: Record<string, unknown>;
};

let pdfFontsReady = false;

function ensurePdfFonts() {
  if (pdfFontsReady) return;
  for (const [name, entry] of Object.entries(Roboto.vfs)) {
    pdfmake.virtualfs.writeFileSync(
      name,
      Buffer.from(entry.data, (entry.encoding as BufferEncoding) || 'base64'),
    );
  }
  pdfmake.addFonts(Roboto.fonts);
  pdfFontsReady = true;
}

@Injectable()
export class PdfReportBuilder {
  private formatCurrency(value: number | null | undefined) {
    if (value === null || value === undefined) return '—';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  private toBuffer(docDefinition: object): Promise<Buffer> {
    ensurePdfFonts();
    return pdfmake.createPdf(docDefinition).getBuffer();
  }

  async buildStock(tenantName: string, rows: StockReportRow[]) {
    const generatedAt = new Date().toLocaleString('pt-BR');

    return this.toBuffer({
      pageOrientation: 'landscape',
      pageMargins: [24, 32, 24, 32],
      content: [
        { text: 'Relatório de estoque', style: 'header' },
        { text: tenantName, style: 'subheader' },
        { text: `Gerado em ${generatedAt}`, style: 'muted', margin: [0, 0, 0, 12] },
        {
          table: {
            headerRows: 1,
            widths: ['auto', '*', '*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
            body: [
              [
                'Placa',
                'Marca',
                'Modelo',
                'Ano',
                'Compra',
                'Custos',
                'Anunciado',
                'Margem',
                'Dias',
                'Status',
              ],
              ...rows.map((r) => [
                r.licensePlate,
                r.brand,
                r.model,
                String(r.year),
                this.formatCurrency(r.purchaseValue),
                this.formatCurrency(r.totalCosts),
                this.formatCurrency(r.listedValue),
                this.formatCurrency(r.expectedMargin),
                r.daysInStock !== null ? String(r.daysInStock) : '—',
                r.status,
              ]),
            ],
          },
          layout: 'lightHorizontalLines',
          fontSize: 8,
        },
        rows.length
          ? { text: `Total: ${rows.length} veículo(s)`, style: 'muted', margin: [0, 8, 0, 0] }
          : { text: 'Nenhum veículo em estoque.', style: 'muted', margin: [0, 8, 0, 0] },
      ],
      styles: {
        header: { fontSize: 16, bold: true },
        subheader: { fontSize: 11, margin: [0, 4, 0, 0] },
        muted: { fontSize: 9, color: '#64748b' },
      },
      defaultStyle: { font: 'Roboto', fontSize: 9 },
    });
  }

  async buildSales(tenantName: string, rows: SalesReportRow[], periodLabel: string) {
    const generatedAt = new Date().toLocaleString('pt-BR');

    return this.toBuffer({
      pageOrientation: 'landscape',
      pageMargins: [24, 32, 24, 32],
      content: [
        { text: 'Relatório de vendas', style: 'header' },
        { text: tenantName, style: 'subheader' },
        { text: periodLabel, style: 'muted' },
        { text: `Gerado em ${generatedAt}`, style: 'muted', margin: [0, 0, 0, 12] },
        {
          table: {
            headerRows: 1,
            widths: ['auto', '*', 'auto', '*', '*', 'auto', 'auto', 'auto', 'auto'],
            body: [
              [
                'Data',
                'Veículo',
                'Placa',
                'Cliente',
                'Vendedor',
                'Valor',
                'Pagamento',
                'Status',
                'Comissão',
              ],
              ...rows.map((r) => [
                r.saleDate,
                r.vehicle,
                r.licensePlate,
                r.customer,
                r.seller,
                this.formatCurrency(r.amount),
                r.paymentMethod,
                r.status,
                this.formatCurrency(r.commission),
              ]),
            ],
          },
          layout: 'lightHorizontalLines',
          fontSize: 8,
        },
        rows.length
          ? { text: `Total: ${rows.length} registro(s)`, style: 'muted', margin: [0, 8, 0, 0] }
          : { text: 'Nenhuma venda no período.', style: 'muted', margin: [0, 8, 0, 0] },
      ],
      styles: {
        header: { fontSize: 16, bold: true },
        subheader: { fontSize: 11, margin: [0, 4, 0, 0] },
        muted: { fontSize: 9, color: '#64748b' },
      },
      defaultStyle: { font: 'Roboto', fontSize: 9 },
    });
  }

  async buildSummary(tenantName: string, data: SummaryReportData) {
    const generatedAt = new Date().toLocaleString('pt-BR');

    return this.toBuffer({
      pageMargins: [40, 40, 40, 40],
      content: [
        { text: 'Resumo gerencial', style: 'header' },
        { text: tenantName, style: 'subheader' },
        { text: data.periodLabel, style: 'muted' },
        { text: `Gerado em ${generatedAt}`, style: 'muted', margin: [0, 0, 0, 16] },
        { text: 'Estoque', style: 'section' },
        {
          ul: [
            `Veículos em estoque: ${data.stock.totalStock}`,
            `Investimento total: ${this.formatCurrency(data.stock.totalInvestment)}`,
            `Custos acumulados: ${this.formatCurrency(data.stock.totalCosts)}`,
            `Valor anunciado: ${this.formatCurrency(data.stock.totalListedValue)}`,
          ],
        },
        { text: 'Vendas no período', style: 'section', margin: [0, 12, 0, 0] },
        {
          ul: [
            `Quantidade: ${data.sales.salesCount}`,
            `Receita: ${this.formatCurrency(data.sales.totalRevenue)}`,
            `Lucro: ${this.formatCurrency(data.sales.totalProfit)}`,
            `Ticket médio: ${this.formatCurrency(data.sales.averageTicket)}`,
            `Média dias em estoque: ${data.sales.averageDaysInStock}`,
            `Comissões: ${this.formatCurrency(data.sales.totalCommission)}`,
          ],
        },
        { text: 'Ranking de vendedores', style: 'section', margin: [0, 12, 0, 8] },
        data.ranking.length
          ? {
              table: {
                headerRows: 1,
                widths: ['auto', '*', 'auto', 'auto', 'auto'],
                body: [
                  ['#', 'Vendedor', 'Vendas', 'Receita', 'Comissão'],
                  ...data.ranking.map((r) => [
                    String(r.position),
                    r.sellerName,
                    String(r.salesCount),
                    this.formatCurrency(r.totalRevenue),
                    this.formatCurrency(r.totalCommission),
                  ]),
                ],
              },
              layout: 'lightHorizontalLines',
            }
          : { text: 'Sem vendas no período para ranking.', style: 'muted' },
      ],
      styles: {
        header: { fontSize: 18, bold: true },
        subheader: { fontSize: 12, margin: [0, 4, 0, 0] },
        section: { fontSize: 12, bold: true },
        muted: { fontSize: 9, color: '#64748b' },
      },
      defaultStyle: { font: 'Roboto', fontSize: 10 },
    });
  }
}
