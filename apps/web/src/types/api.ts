export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'SELLER' | 'MODERATOR';
  tenantId: string | null;
  permissions: string[];
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  user: AuthUser;
}

export interface StockItem {
  id: string;
  photo: { url: string } | null;
  licensePlate: string | null;
  brand: string;
  model: string;
  version?: string | null;
  year: number;
  purchaseValue: string;
  totalCosts: string;
  listedValue: string | null;
  saleValue: string | null;
  expectedMargin: string | null;
  status: string;
  daysInStock: number | null;
}

export interface Sale {
  id: string;
  vehicleId: string;
  customerId: string;
  sellerId: string;
  amount: string;
  paymentMethod: string;
  saleDate: string;
  status: string;
  commission: string | null;
  notes: string | null;
  createdAt?: string;
  updatedAt?: string;
  vehicle?: {
    id: string;
    brand: string;
    model: string;
    licensePlate: string | null;
    status: string;
  };
  customer?: { id: string; name: string; document: string; phone?: string | null };
  seller?: { id: string; name: string; email: string };
}

export interface CommissionReportRow {
  id: string;
  saleDate: string;
  status: string;
  seller: { id: string; name: string; email: string } | null;
  vehicle: {
    id: string;
    brand: string;
    model: string;
    licensePlate: string | null;
    type: string;
  } | null;
  amount: string;
  profit: string | null;
  commission: string | null;
}

export interface CommissionReportResponse {
  summary: {
    vehiclesSold: number;
    totalSalesAmount: string;
    totalProfit: string;
    totalCommission: string;
  };
  rows: CommissionReportRow[];
}

export interface GeneralReportResponse {
  salesCount: number;
  totalRevenue: string;
  totalAcquisitionCost: string;
  totalOperationalCosts: string;
  grossProfit: string;
  grossMarginPercent: string | null;
  totalCommission: string;
  estimatedNetResult: string;
}

export interface Customer {
  id: string;
  name: string;
  document: string;
  phone: string | null;
  email: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  personType: string;
  customerType: string;
  notes: string | null;
  assignedSellerId: string | null;
  assignedSeller?: { id: string; name: string; email: string } | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  document: string;
  phone: string | null;
  email: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  personType: string;
  category: string;
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EntityHistoryEntry {
  id: string;
  action: string;
  details: Record<string, unknown> | null;
  userId: string | null;
  createdAt: string;
}

export interface TenantSettingsResponse {
  settings: Record<string, unknown>;
  knownKeys: string[];
}

export interface ConfigCatalogItem {
  id: string;
  name: string;
  code: string;
  sortOrder: number;
  active: boolean;
}

export interface ConfigStatusItem {
  id: string;
  entity: string;
  name: string;
  code: string;
  color: string | null;
  sortOrder: number;
  active: boolean;
}

export interface ConfigEmailTemplate {
  id: string;
  code: string;
  subject: string;
  bodyHtml: string;
  active: boolean;
}

export type ConfigCatalogResource = 'vehicle-types' | 'cost-types' | 'payment-methods';

export interface TenantSummary {
  id: string;
  name: string;
  cnpj: string;
  email: string;
  phone: string | null;
  status: string;
  plan: string;
}

export interface TenantBranch {
  id: string;
  tenantId: string;
  name: string;
  address: string | null;
  phone: string | null;
  active: boolean;
  sortOrder: number;
}

export interface SupplierPurchase {
  vehicleId: string;
  brand: string;
  model: string;
  licensePlate: string | null;
  status: string;
  modelYear: number;
  purchaseValue: string;
  purchaseDate: string | null;
}

export interface VehicleOption {
  id: string;
  brand: string;
  model: string;
  licensePlate: string | null;
  status: string;
}

export interface VehiclePhoto {
  id: string;
  fileName: string;
  filePath: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: string;
}

export interface VehicleFinancial {
  purchaseValue: string;
  purchaseDate: string | null;
  listedValue: string | null;
  saleValue: string | null;
  totalCosts: string;
  daysInStock: number | null;
}

export interface NamedEntity {
  id: string;
  name: string;
}

export interface VehicleFinancialDetail {
  id: string;
  vehicleId: string;
  purchaseValue: string;
  purchaseDate: string | null;
  supplierId: string | null;
  supplier: NamedEntity | null;
  fipeValue: string | null;
  suggestedPurchaseValue: string | null;
  listedValue: string | null;
  minimumValue: string | null;
  saleValue: string | null;
  saleDate: string | null;
  customerId: string | null;
  customer: NamedEntity | null;
  sellerId: string | null;
  seller: NamedEntity | null;
  totalCosts: string;
  commissionValue: string;
  grossProfit: string | null;
  marginAmount: string | null;
  marginPercent: string | null;
  netResult: string | null;
  daysInStock: number | null;
  calculatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CostReceiptAttachment {
  id: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  url: string;
  createdAt: string;
}

export interface VehicleCost {
  id: string;
  vehicleId: string;
  type: string;
  description: string;
  amount: string;
  costDate: string;
  supplierId: string | null;
  supplier: NamedEntity | null;
  responsibleId: string | null;
  responsible: NamedEntity | null;
  createdById: string | null;
  createdBy: NamedEntity | null;
  receipt: CostReceiptAttachment | null;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialResultSummary {
  purchaseValue: string;
  totalCosts: string;
  saleValue: string | null;
  commissionValue: string;
  grossProfit: string | null;
  marginAmount: string | null;
  marginPercent: string | null;
  netResult: string | null;
  daysInStock: number | null;
  calculatedAt: string | null;
}

export interface SuggestPurchaseResult {
  fipeValue: string;
  estimatedCosts: string;
  desiredMarginPercent?: number;
  desiredMarginAmount?: string;
  suggestedPurchaseValue: string;
  formula: string;
}

export interface Vehicle {
  id: string;
  type: string;
  brand: string;
  model: string;
  version: string | null;
  manufactureYear: number;
  modelYear: number;
  licensePlate: string | null;
  renavam: string | null;
  chassis: string | null;
  color: string | null;
  mileage: number | null;
  fuel: string | null;
  transmission: string | null;
  doors: number | null;
  category: string | null;
  status: string;
  notes: string | null;
  financial: VehicleFinancial | null;
  primaryPhoto: VehiclePhoto | null;
  photos?: VehiclePhoto[];
  createdAt: string;
  updatedAt: string;
}

export interface TenantUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
  address?: string | null;
  active?: boolean;
  deactivatedAt?: string | null;
  deactivationReason?: string | null;
}

export interface ManagerDashboard {
  period: { startDate?: string; endDate?: string };
  stock: {
    totalStock: number;
    totalInvestment: string;
    totalCosts: string;
    totalListedValue: string;
    averageStockDaysInStock: number;
  };
  sales: {
    salesCount: number;
    totalRevenue: string;
    totalGrossProfit: string;
    totalNetProfit: string;
    /** legado — igual a totalNetProfit */
    totalProfit?: string;
    averageMarginPercent: string;
    averageTicket: string;
    averageDaysInStock: number;
    totalCommission: string;
  };
}

export interface SellerDashboard {
  period: { startDate?: string; endDate?: string };
  seller: { id: string; name: string };
  vehiclesSold: number;
  totalNegotiations: number;
  conversionRate: number;
  totalRevenue: string;
  totalCommission: string;
}

export interface SellerRanking {
  period: { startDate?: string; endDate?: string };
  ranking: Array<{
    position: number;
    seller?: { id: string; name: string; email: string };
    salesCount: number;
    totalRevenue: string;
    totalGrossProfit: string;
    totalNetProfit: string;
    totalCommission: string;
    averageMarginPercent: string;
    conversionRate: number;
    totalNegotiations: number;
  }>;
}
