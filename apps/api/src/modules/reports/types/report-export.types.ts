export interface ReportFile {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

export interface StockReportRow {
  licensePlate: string;
  brand: string;
  model: string;
  version: string;
  year: number;
  purchaseValue: number;
  totalCosts: number;
  listedValue: number | null;
  expectedMargin: number | null;
  daysInStock: number | null;
  status: string;
}

export interface SalesReportRow {
  saleDate: string;
  vehicle: string;
  licensePlate: string;
  customer: string;
  seller: string;
  amount: number;
  paymentMethod: string;
  status: string;
  commission: number | null;
}

export interface SummaryReportData {
  periodLabel: string;
  stock: {
    totalStock: number;
    totalInvestment: number;
    totalCosts: number;
    totalListedValue: number;
  };
  sales: {
    salesCount: number;
    totalRevenue: number;
    totalProfit: number;
    averageTicket: number;
    averageDaysInStock: number;
    totalCommission: number;
  };
  ranking: Array<{
    position: number;
    sellerName: string;
    salesCount: number;
    totalRevenue: number;
    totalCommission: number;
  }>;
}
