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
  branchId?: string | null;
  permissions: string[];
}

export interface LoginResponse {
  accessToken?: string;
  refreshToken?: string;
  expiresIn: string;
  user?: AuthUser;
  requiresTwoFactor?: boolean;
  twoFactorToken?: string;
}

export interface TwoFactorStatus {
  eligible: boolean;
  enabled: boolean;
}

export interface TwoFactorSetupResponse {
  secret: string;
  otpauthUrl: string;
}

export interface StockItem {
  id: string;
  photo: Pick<VehiclePhoto, 'url' | 'thumbnailUrl'> | null;
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
  branchId?: string | null;
  branchName?: string;
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

export interface ProfileAccessFeature {
  id: string;
  label: string;
  description: string;
  permission: string;
  group: 'principal' | 'cadastro' | 'relatorios' | 'sistema';
  enabled: boolean;
}

export interface ProfileAccessRoleConfig {
  role: 'MANAGER' | 'SELLER';
  label: string;
  features: ProfileAccessFeature[];
  enabledFeatures: string[];
}

export interface ProfileAccessResponse {
  roles: ProfileAccessRoleConfig[];
  groups: { id: string; label: string }[];
  defaults: Record<'MANAGER' | 'SELLER', string[]>;
  isCustomized: boolean;
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

export interface EmailNotificationVariable {
  name: string;
  description: string;
}

export interface EmailNotificationTypeConfig {
  code: string;
  label: string;
  description: string;
  recipient: 'customer' | 'tenant_notification' | 'user' | 'seller';
  recipientLabel: string;
  triggerDescription: string;
  supportsRoleRecipients: boolean;
  recipientRoles: Array<'ADMIN' | 'MANAGER' | 'SELLER'>;
  variables: EmailNotificationVariable[];
  id: string | null;
  subject: string;
  bodyHtml: string;
  active: boolean;
  isConfigured: boolean;
  defaults: {
    subject: string;
    bodyHtml: string;
  };
}

export interface EmailNotificationsConfiguration {
  senderEmail: string;
  roles: Array<{ role: 'ADMIN' | 'MANAGER' | 'SELLER'; label: string }>;
  defaultRecipients: Record<string, Array<'ADMIN' | 'MANAGER' | 'SELLER'>>;
  types: EmailNotificationTypeConfig[];
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
  createdAt?: string;
  updatedAt?: string;
}

export interface TenantUsageMetrics {
  activeUsers: number;
  totalUsers: number;
  branches: number;
  vehicles: number;
  stockVehicles: number;
  customers: number;
  salesInPeriod: number;
  revenueInPeriod: string;
}

export interface TenantPlatformMetrics {
  tenant: TenantSummary;
  usage: TenantUsageMetrics;
}

export interface PlatformMetricsResponse {
  period: {
    startDate: string;
    endDate: string;
    label: string;
  };
  tenants: TenantPlatformMetrics[];
  totals: TenantUsageMetrics & {
    tenantCount: number;
    revenueInPeriod: string;
  };
  meta: PaginatedMeta;
  cachedAt?: string;
}

export type ExportJobType = 'STOCK' | 'SALES' | 'SUMMARY';

export type ExportJobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface ExportJobResponse {
  id: string;
  type: ExportJobType;
  format: 'pdf' | 'xlsx';
  status: ExportJobStatus;
  fileName: string | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
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
  thumbnailUrl: string | null;
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

export interface PlateLookupPurchase {
  purchaseValue: string;
  purchaseDate: string | null;
  supplier: NamedEntity | null;
  fipeValue: string | null;
  suggestedPurchaseValue: string | null;
  listedValue: string | null;
  minimumValue: string | null;
}

export interface StockMovementItem {
  id: string;
  vehicleId: string;
  type: string;
  description: string | null;
  reference: string | null;
  userId: string | null;
  user: NamedEntity | null;
  createdAt: string;
}

export type PlateLookupResponse =
  | { found: false; plate: string }
  | {
      found: true;
      plate: string;
      vehicle: Vehicle;
      purchase: PlateLookupPurchase | null;
      sales: Sale[];
      costs: VehicleCost[];
      financialResult: FinancialResultSummary | null;
      stockMovements: StockMovementItem[];
    };

export interface SuggestPurchaseResult {
  fipeValue: string;
  estimatedCosts: string;
  desiredMarginPercent?: number;
  desiredMarginAmount?: string;
  suggestedPurchaseValue: string;
  formula: string;
}

export interface PurchaseIntelligenceAnalysis {
  queryId: string;
  licensePlate: string;
  provider: 'mock' | 'http';
  referenceMonth?: string;
  fipe: {
    value: string;
    vehicle: {
      brand: string;
      model: string;
      modelYear: number;
      manufactureYear: number;
      version?: string;
      fuel?: string;
      color?: string;
    };
  };
  analysis: {
    desiredMarginPercent: number;
    marginAmount: string;
    estimatedCosts: string;
    maxPurchaseValue: string;
    formula: string;
  };
  existingInStock: StockItem | null;
  defaultsUsed: {
    defaultMarginPercent: number;
    estimatedPrepCosts: number;
  };
}

export interface PurchaseIntelligenceHistoryItem {
  id: string;
  licensePlate: string;
  fipeValue: string | null;
  desiredMarginPercent: string | null;
  estimatedCosts: string | null;
  maxPurchaseValue: string | null;
  provider: string | null;
  brand: string | null;
  model: string | null;
  modelYear: number | null;
  existingVehicleId: string | null;
  createdAt: string;
  userId: string | null;
}

export interface PricingIntelligenceAnalysis {
  queryId: string;
  vehicle: {
    id: string;
    label: string;
    brand: string;
    model: string;
    version?: string | null;
    modelYear: number;
    licensePlate?: string | null;
    mileage?: number | null;
    status: string;
  };
  fipe: {
    value: string | null;
    provider: string;
    referenceMonth?: string | null;
  };
  sources: {
    internalHistory: {
      sampleCount: number;
      averageSalePrice: string | null;
      averageDaysToSell: number | null;
    };
    similarInStock: {
      sampleCount: number;
      averageListedPrice: string | null;
    };
    marketPortals: {
      provider: string;
      referenceMonth: string;
      averageListingPrice: string;
      sampleCount: number;
      portals: string[];
      portalQuotes: Array<{
        portal: string;
        averageListingPrice: string;
        sampleCount: number;
        minPrice: string | null;
        maxPrice: string | null;
        error?: string | null;
      }>;
    } | null;
    tenantAvgDaysToSell: number | null;
  };
  context: {
    purchaseValue: string;
    totalCosts: string;
    totalInvested: string;
    daysInStock: number | null;
    minMarginPercent: number;
    marketReference: string;
    minPriceFromMargin: string;
    urgencyAdjustmentPercent: number;
  };
  suggestions: {
    conservative: string;
    competitive: string;
    aggressive: string;
    idealListing: string;
    minimumRecommended: string;
  };
  insights: string[];
  defaultsUsed: {
    minMarginPercent: number;
  };
}

export interface PricingIntelligenceHistoryItem {
  id: string;
  vehicleId: string;
  vehicleLabel: string | null;
  fipeValue: string | null;
  marketReference: string | null;
  minMarginPercent: number;
  suggestions: {
    conservative: string | null;
    competitive: string | null;
    aggressive: string | null;
    idealListing: string | null;
    minimumRecommended: string | null;
  };
  createdAt: string;
}

export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'NEGOTIATION'
  | 'WON'
  | 'LOST';

export type LeadSource =
  | 'WHATSAPP'
  | 'PHONE'
  | 'STORE'
  | 'WEBSITE'
  | 'REFERRAL'
  | 'OTHER';

export type ContactChannel = 'PHONE' | 'WHATSAPP' | 'EMAIL' | 'VISIT' | 'OTHER';

export type VehicleDocumentType =
  | 'CRLV'
  | 'INVOICE'
  | 'PURCHASE_CONTRACT'
  | 'SALE_CONTRACT'
  | 'CAUTELAR_REPORT'
  | 'OTHER';

export interface CrmLead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  source: LeadSource;
  status: LeadStatus;
  sellerId: string | null;
  seller: { id: string; name: string; email: string } | null;
  customerId: string | null;
  expectedAmount: string | null;
  notes: string | null;
  nextFollowUpAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CrmLeadDetail extends CrmLead {
  contacts: Array<{
    id: string;
    channel: ContactChannel;
    summary: string;
    contactedAt: string;
    whatsappLink?: string;
    user: { id: string; name: string } | null;
  }>;
  interests: Array<{
    id: string;
    vehicleId: string;
    vehicle: {
      id: string;
      brand: string;
      model: string;
      licensePlate: string | null;
      status: string;
    } | null;
    notes: string | null;
  }>;
}

export interface CrmOpportunity {
  id: string;
  title: string;
  status: string;
  amount: string | null;
  customer: { id: string; name: string } | null;
  vehicle: { id: string; brand: string; model: string; licensePlate: string | null } | null;
  seller: { id: string; name: string } | null;
  nextFollowUpAt: string | null;
  createdAt: string;
}

export interface CrmReminder {
  id: string;
  title: string;
  description: string | null;
  dueAt: string;
  status: 'PENDING' | 'DONE' | 'CANCELLED';
  leadId: string | null;
  opportunityId: string | null;
  autoGenerated: boolean;
}

export interface CrmFunnel {
  leads: Record<string, number>;
  opportunities: Record<string, number>;
}

export interface VehicleDocument {
  id: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  documentType: VehicleDocumentType | null;
  url: string;
  createdAt: string;
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
  branchId?: string | null;
  branchName?: string;
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
  branchId?: string | null;
  branchName?: string | null;
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
