import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  setAuthSession,
} from './auth-storage';
import { notifyNetworkError, notifySessionExpired } from './notify-api-error';
import type {
  ApiSuccess,
  AuthUser,
  Customer,
  EntityHistoryEntry,
  Supplier,
  ConfigCatalogItem,
  ConfigCatalogResource,
  ConfigEmailTemplate,
  ConfigStatusItem,
  SupplierPurchase,
  TenantBranch,
  TenantSummary,
  TenantSettingsResponse,
  TenantUser,
  Vehicle,
  CostReceiptAttachment,
  VehicleCost,
  VehicleFinancialDetail,
  VehiclePhoto,
  FinancialResultSummary,
  SuggestPurchaseResult,
  LoginResponse,
  TwoFactorSetupResponse,
  TwoFactorStatus,
  ManagerDashboard,
  PaginatedResponse,
  PlateLookupResponse,
  PurchaseIntelligenceAnalysis,
  PurchaseIntelligenceHistoryItem,
  PricingIntelligenceAnalysis,
  PricingIntelligenceHistoryItem,
  CrmLead,
  CrmLeadDetail,
  CrmOpportunity,
  CrmReminder,
  CrmFunnel,
  VehicleDocument,
  VehicleDocumentType,
  Sale,
  SellerDashboard,
  SellerRanking,
  StockItem,
  CommissionReportResponse,
  GeneralReportResponse,
  PlatformMetricsResponse,
  ExportJobResponse,
  ProfileAccessResponse,
  EmailNotificationsConfiguration,
} from '@/types/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = RequestInit & { skipAuth?: boolean; silent?: boolean };

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    clearAuthSession();
    return null;
  }

  const data = (await res.json()) as LoginResponse;
  if (data.accessToken && data.refreshToken && data.user) {
    setAuthSession(data.accessToken, data.refreshToken, data.user);
    return data.accessToken;
  }
  return null;
}

async function fetchWithAuthRetry(
  url: string,
  options: RequestOptions,
): Promise<Response> {
  const { skipAuth, silent, headers, ...rest } = options;

  const buildHeaders = (token: string | null) => ({
    'Content-Type': 'application/json',
    ...(token && !skipAuth ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  });

  let token = skipAuth ? null : getAccessToken();

  const doFetch = () =>
    fetch(url, {
      ...rest,
      headers: buildHeaders(token),
    });

  let response: Response;
  try {
    response = await doFetch();
  } catch {
    if (!silent) {
      notifyNetworkError();
    }
    throw new ApiError('Sem conexão com o servidor', 0, 'NETWORK_ERROR');
  }

  if (response.status === 401 && !skipAuth) {
    token = await refreshAccessToken();
    if (token) {
      try {
        response = await doFetch();
      } catch {
        if (!silent) {
          notifyNetworkError();
        }
        throw new ApiError('Sem conexão com o servidor', 0, 'NETWORK_ERROR');
      }
    } else {
      if (!silent) {
        notifySessionExpired();
      }
      throw new ApiError('Sessão expirada', 401, 'SESSION_EXPIRED');
    }
  }

  if (response.status === 401 && !skipAuth) {
    if (!silent) {
      notifySessionExpired();
    }
    throw new ApiError('Sessão expirada', 401, 'SESSION_EXPIRED');
  }

  return response;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_URL}${path}`;
  const response = await fetchWithAuthRetry(url, options);

  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      (body as { message?: string | string[] }).message ?? 'Erro na requisição';
    throw new ApiError(
      Array.isArray(message) ? message.join(', ') : message,
      response.status,
      (body as { code?: string }).code,
    );
  }

  return body as T;
}

function unwrap<T>(body: T | ApiSuccess<T>): T {
  if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
    return (body as ApiSuccess<T>).data;
  }
  return body as T;
}

async function apiFormRequest<T>(
  path: string,
  options: { method?: string; body: FormData; silent?: boolean },
): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_URL}${path}`;
  const authHeaders = (token: string | null): HeadersInit =>
    token ? { Authorization: `Bearer ${token}` } : {};

  let token = getAccessToken();

  const doFetch = () =>
    fetch(url, {
      method: options.method ?? 'POST',
      headers: authHeaders(token),
      body: options.body,
    });

  let response: Response;
  try {
    response = await doFetch();
  } catch {
    if (!options.silent) {
      notifyNetworkError();
    }
    throw new ApiError('Sem conexão com o servidor', 0, 'NETWORK_ERROR');
  }

  if (response.status === 401) {
    token = await refreshAccessToken();
    if (token) {
      try {
        response = await doFetch();
      } catch {
        if (!options.silent) {
          notifyNetworkError();
        }
        throw new ApiError('Sem conexão com o servidor', 0, 'NETWORK_ERROR');
      }
    } else {
      if (!options.silent) {
        notifySessionExpired();
      }
      throw new ApiError('Sessão expirada', 401, 'SESSION_EXPIRED');
    }
  }

  if (response.status === 401) {
    if (!options.silent) {
      notifySessionExpired();
    }
    throw new ApiError('Sessão expirada', 401, 'SESSION_EXPIRED');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      (body as { message?: string | string[] }).message ?? 'Erro na requisição';
    throw new ApiError(
      Array.isArray(message) ? message.join(', ') : message,
      response.status,
      (body as { code?: string }).code,
    );
  }

  return unwrap(body as T | ApiSuccess<T>);
}

export const api = {
  login: async (payload: {
    email: string;
    password: string;
    tenantCnpj?: string;
  }) => {
    const data = await apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
    });

    if (data.requiresTwoFactor) {
      return data;
    }

    if (data.accessToken && data.refreshToken && data.user) {
      setAuthSession(data.accessToken, data.refreshToken, data.user);
    }

    return data;
  },

  verifyTwoFactor: async (payload: { twoFactorToken: string; code: string }) => {
    const data = await apiRequest<LoginResponse>('/auth/2fa/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
    });

    if (data.accessToken && data.refreshToken && data.user) {
      setAuthSession(data.accessToken, data.refreshToken, data.user);
    }

    return data;
  },

  getTwoFactorStatus: () =>
    apiRequest<TwoFactorStatus | ApiSuccess<TwoFactorStatus>>('/auth/2fa/status').then(unwrap),

  setupTwoFactor: () =>
    apiRequest<TwoFactorSetupResponse | ApiSuccess<TwoFactorSetupResponse>>('/auth/2fa/setup', {
      method: 'POST',
    }).then(unwrap),

  enableTwoFactor: (code: string) =>
    apiRequest<{ message: string } | ApiSuccess<{ message: string }>>('/auth/2fa/enable', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }).then(unwrap),

  disableTwoFactor: (payload: { code: string; password: string }) =>
    apiRequest<{ message: string } | ApiSuccess<{ message: string }>>('/auth/2fa/disable', {
      method: 'POST',
      body: JSON.stringify(payload),
    }).then(unwrap),

  forgotPassword: (email: string) =>
    apiRequest<{ message: string } | ApiSuccess<{ message: string }>>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
      skipAuth: true,
    }).then(unwrap),

  resetPasswordWithToken: (payload: { token: string; newPassword: string }) =>
    apiRequest<{ message: string } | ApiSuccess<{ message: string }>>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
    }).then(unwrap),

  me: () => apiRequest<AuthUser | ApiSuccess<AuthUser>>('/auth/me').then(unwrap),

  logout: async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      await apiRequest('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      }).catch(() => undefined);
    }
    clearAuthSession();
  },

  getStock: (params: Record<string, string | number | undefined>) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.set(k, String(v));
    });
    return apiRequest<PaginatedResponse<StockItem>>(`/stock?${qs}`);
  },

  lookupStockByPlate: (plate: string) =>
    apiRequest<PlateLookupResponse | ApiSuccess<PlateLookupResponse>>(
      `/stock/plate/${encodeURIComponent(plate.trim())}/lookup`,
    ).then(unwrap),

  analyzePurchaseIntelligence: (payload: {
    licensePlate: string;
    desiredMarginPercent?: number;
    estimatedCosts?: number;
  }) =>
    apiRequest<
      PurchaseIntelligenceAnalysis | ApiSuccess<PurchaseIntelligenceAnalysis>
    >('/purchase-intelligence/analyze', {
      method: 'POST',
      body: JSON.stringify(payload),
    }).then(unwrap),

  getPurchaseIntelligenceHistory: (params?: {
    page?: number;
    limit?: number;
    licensePlate?: string;
  }) => {
    const qs = new URLSearchParams({
      page: String(params?.page ?? 1),
      limit: String(params?.limit ?? 10),
    });
    if (params?.licensePlate) qs.set('licensePlate', params.licensePlate);
    return apiRequest<
      PaginatedResponse<PurchaseIntelligenceHistoryItem> | ApiSuccess<
        PaginatedResponse<PurchaseIntelligenceHistoryItem>
      >
    >(`/purchase-intelligence/history?${qs}`).then(unwrap);
  },

  analyzePricingIntelligence: (payload: {
    vehicleId: string;
    minMarginPercent?: number;
  }) =>
    apiRequest<PricingIntelligenceAnalysis | ApiSuccess<PricingIntelligenceAnalysis>>(
      '/pricing-intelligence/analyze',
      { method: 'POST', body: JSON.stringify(payload) },
    ).then(unwrap),

  getPricingIntelligenceHistory: (params?: {
    page?: number;
    limit?: number;
    vehicleId?: string;
  }) => {
    const qs = new URLSearchParams({
      page: String(params?.page ?? 1),
      limit: String(params?.limit ?? 10),
    });
    if (params?.vehicleId) qs.set('vehicleId', params.vehicleId);
    return apiRequest<
      PaginatedResponse<PricingIntelligenceHistoryItem> | ApiSuccess<
        PaginatedResponse<PricingIntelligenceHistoryItem>
      >
    >(`/pricing-intelligence/history?${qs}`).then(unwrap);
  },

  getSales: (params: Record<string, string | number | undefined>) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.set(k, String(v));
    });
    return apiRequest<PaginatedResponse<Sale>>(`/sales?${qs}`);
  },

  getGeneralReport: (params: {
    startDate?: string;
    endDate?: string;
    vehicleType?: string;
    sellerId?: string;
    branchId?: string;
    status?: string;
  }) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.set(k, String(v));
    });
    return apiRequest<GeneralReportResponse | ApiSuccess<GeneralReportResponse>>(
      `/reports/general?${qs}`,
    ).then(unwrap);
  },

  getCommissionReport: (params: {
    sellerId?: string;
    branchId?: string;
    startDate?: string;
    endDate?: string;
    vehicleType?: string;
    status?: string;
  }) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.set(k, String(v));
    });
    return apiRequest<CommissionReportResponse | ApiSuccess<CommissionReportResponse>>(
      `/sales/commissions/report?${qs}`,
    ).then(unwrap);
  },

  getSale: (id: string) =>
    apiRequest<Sale | ApiSuccess<Sale>>(`/sales/${id}`).then(unwrap),

  createSale: (payload: Record<string, unknown>) =>
    apiRequest<Sale | ApiSuccess<Sale>>('/sales', {
      method: 'POST',
      body: JSON.stringify(payload),
    }).then(unwrap),

  updateSale: (id: string, payload: Record<string, unknown>) =>
    apiRequest<Sale | ApiSuccess<Sale>>(`/sales/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }).then(unwrap),

  getCustomers: (params?: Record<string, string | number | undefined>) => {
    const qs = new URLSearchParams({ limit: '20', page: '1' });
    Object.entries(params ?? {}).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.set(k, String(v));
    });
    return apiRequest<PaginatedResponse<Customer>>(`/customers?${qs}`);
  },

  getCustomer: (id: string) =>
    apiRequest<Customer | ApiSuccess<Customer>>(`/customers/${id}`).then(unwrap),

  createCustomer: (payload: Record<string, unknown>) =>
    apiRequest<Customer | ApiSuccess<Customer>>('/customers', {
      method: 'POST',
      body: JSON.stringify(payload),
    }).then(unwrap),

  updateCustomer: (id: string, payload: Record<string, unknown>) =>
    apiRequest<Customer | ApiSuccess<Customer>>(`/customers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }).then(unwrap),

  getCustomerHistory: (id: string, page = 1) => {
    const qs = new URLSearchParams({ page: String(page), limit: '20' });
    return apiRequest<PaginatedResponse<EntityHistoryEntry>>(
      `/customers/${id}/history?${qs}`,
    );
  },

  addCustomerHistoryNote: (id: string, note: string) =>
    apiRequest<EntityHistoryEntry | ApiSuccess<EntityHistoryEntry>>(
      `/customers/${id}/history`,
      { method: 'POST', body: JSON.stringify({ note }) },
    ).then(unwrap),

  getSuppliers: (params?: Record<string, string | number | undefined>) => {
    const qs = new URLSearchParams({ limit: '20', page: '1' });
    Object.entries(params ?? {}).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.set(k, String(v));
    });
    return apiRequest<PaginatedResponse<Supplier>>(`/suppliers?${qs}`);
  },

  getSupplier: (id: string) =>
    apiRequest<Supplier | ApiSuccess<Supplier>>(`/suppliers/${id}`).then(unwrap),

  createSupplier: (payload: Record<string, unknown>) =>
    apiRequest<Supplier | ApiSuccess<Supplier>>('/suppliers', {
      method: 'POST',
      body: JSON.stringify(payload),
    }).then(unwrap),

  updateSupplier: (id: string, payload: Record<string, unknown>) =>
    apiRequest<Supplier | ApiSuccess<Supplier>>(`/suppliers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }).then(unwrap),

  getSupplierHistory: (id: string, page = 1) => {
    const qs = new URLSearchParams({ page: String(page), limit: '20' });
    return apiRequest<PaginatedResponse<EntityHistoryEntry>>(
      `/suppliers/${id}/history?${qs}`,
    );
  },

  addSupplierHistoryNote: (id: string, note: string) =>
    apiRequest<EntityHistoryEntry | ApiSuccess<EntityHistoryEntry>>(
      `/suppliers/${id}/history`,
      { method: 'POST', body: JSON.stringify({ note }) },
    ).then(unwrap),

  getSupplierPurchases: (id: string) =>
    apiRequest<SupplierPurchase[] | ApiSuccess<SupplierPurchase[]>>(
      `/suppliers/${id}/purchases`,
    ).then(unwrap),

  getManagerDashboard: (params?: {
    startDate?: string;
    endDate?: string;
    branchId?: string;
    sellerId?: string;
  }) => {
    const qs = new URLSearchParams();
    Object.entries(params ?? {}).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.set(k, String(v));
    });
    const q = qs.toString();
    return apiRequest<ManagerDashboard | ApiSuccess<ManagerDashboard>>(
      `/dashboard/manager${q ? `?${q}` : ''}`,
    ).then(unwrap);
  },

  getSellerDashboard: (params?: { startDate?: string; endDate?: string }) => {
    const qs = new URLSearchParams();
    if (params?.startDate) qs.set('startDate', params.startDate);
    if (params?.endDate) qs.set('endDate', params.endDate);
    const q = qs.toString();
    return apiRequest<SellerDashboard | ApiSuccess<SellerDashboard>>(
      `/dashboard/seller${q ? `?${q}` : ''}`,
    ).then(unwrap);
  },

  getSellerRanking: (params?: {
    startDate?: string;
    endDate?: string;
    branchId?: string;
    sellerId?: string;
  }) => {
    const qs = new URLSearchParams();
    Object.entries(params ?? {}).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.set(k, String(v));
    });
    const q = qs.toString();
    return apiRequest<SellerRanking | ApiSuccess<SellerRanking>>(
      `/dashboard/seller/ranking${q ? `?${q}` : ''}`,
    ).then(unwrap);
  },

  getVehicles: (params?: Record<string, string | number | undefined>) => {
    const qs = new URLSearchParams({ limit: '20', page: '1' });
    Object.entries(params ?? {}).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.set(k, String(v));
    });
    return apiRequest<PaginatedResponse<Vehicle>>(`/vehicles?${qs}`);
  },

  getVehicle: (id: string) =>
    apiRequest<Vehicle | ApiSuccess<Vehicle>>(`/vehicles/${id}`).then(unwrap),

  createVehicle: (payload: Record<string, unknown>) =>
    apiRequest<Vehicle | ApiSuccess<Vehicle>>('/vehicles', {
      method: 'POST',
      body: JSON.stringify(payload),
    }).then(unwrap),

  updateVehicle: (id: string, payload: Record<string, unknown>) =>
    apiRequest<Vehicle | ApiSuccess<Vehicle>>(`/vehicles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }).then(unwrap),

  getVehiclePhotos: (vehicleId: string) =>
    apiRequest<VehiclePhoto[] | ApiSuccess<VehiclePhoto[]>>(
      `/vehicles/${vehicleId}/photos`,
    ).then(unwrap),

  uploadVehiclePhoto: (vehicleId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiFormRequest<VehiclePhoto>(`/vehicles/${vehicleId}/photos`, {
      method: 'POST',
      body: form,
    });
  },

  setVehiclePhotoPrimary: (vehicleId: string, photoId: string) =>
    apiRequest<VehiclePhoto | ApiSuccess<VehiclePhoto>>(
      `/vehicles/${vehicleId}/photos/${photoId}/primary`,
      { method: 'PATCH' },
    ).then(unwrap),

  deleteVehiclePhoto: (vehicleId: string, photoId: string) =>
    apiRequest(`/vehicles/${vehicleId}/photos/${photoId}`, {
      method: 'DELETE',
    }),

  getVehicleFinancial: (vehicleId: string) =>
    apiRequest<VehicleFinancialDetail | ApiSuccess<VehicleFinancialDetail>>(
      `/vehicles/${vehicleId}/financial`,
    ).then(unwrap),

  updateVehicleFinancial: (vehicleId: string, payload: Record<string, unknown>) =>
    apiRequest<VehicleFinancialDetail | ApiSuccess<VehicleFinancialDetail>>(
      `/vehicles/${vehicleId}/financial`,
      { method: 'PATCH', body: JSON.stringify(payload) },
    ).then(unwrap),

  recalculateVehicleFinancial: (vehicleId: string) =>
    apiRequest<
      | { message: string; result: FinancialResultSummary }
      | ApiSuccess<{ message: string; result: FinancialResultSummary }>
    >(`/vehicles/${vehicleId}/financial/recalculate`, { method: 'POST' }).then(unwrap),

  suggestVehiclePurchase: (
    vehicleId: string,
    payload: Record<string, unknown>,
  ) =>
    apiRequest<SuggestPurchaseResult | ApiSuccess<SuggestPurchaseResult>>(
      `/vehicles/${vehicleId}/financial/suggest-purchase`,
      { method: 'POST', body: JSON.stringify(payload) },
    ).then(unwrap),

  getVehicleCosts: (vehicleId: string, page = 1, limit = 50) => {
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
    return apiRequest<PaginatedResponse<VehicleCost>>(
      `/vehicles/${vehicleId}/costs?${qs}`,
    );
  },

  createVehicleCost: (vehicleId: string, payload: Record<string, unknown>) =>
    apiRequest<
      | { cost: VehicleCost; financialResult: FinancialResultSummary | null }
      | ApiSuccess<{ cost: VehicleCost; financialResult: FinancialResultSummary | null }>
    >(`/vehicles/${vehicleId}/costs`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }).then(unwrap),

  updateVehicleCost: (
    vehicleId: string,
    costId: string,
    payload: Record<string, unknown>,
  ) =>
    apiRequest<
      | { cost: VehicleCost; financialResult: FinancialResultSummary | null }
      | ApiSuccess<{ cost: VehicleCost; financialResult: FinancialResultSummary | null }>
    >(`/vehicles/${vehicleId}/costs/${costId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }).then(unwrap),

  deleteVehicleCost: (vehicleId: string, costId: string) =>
    apiRequest(`/vehicles/${vehicleId}/costs/${costId}`, { method: 'DELETE' }),

  uploadVehicleCostReceipt: (vehicleId: string, costId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiFormRequest<CostReceiptAttachment>(
      `/vehicles/${vehicleId}/costs/${costId}/receipt`,
      { method: 'POST', body: form },
    );
  },

  deleteVehicleCostReceipt: (vehicleId: string, costId: string) =>
    apiRequest(`/vehicles/${vehicleId}/costs/${costId}/receipt`, { method: 'DELETE' }),

  getUsers: (params?: {
    page?: number;
    limit?: number;
    role?: string;
    active?: boolean;
    search?: string;
  }) => {
    const qs = new URLSearchParams({
      limit: String(params?.limit ?? 100),
      page: String(params?.page ?? 1),
    });
    if (params?.role) qs.set('role', params.role);
    if (params?.active !== undefined) qs.set('active', String(params.active));
    if (params?.search) qs.set('search', params.search);
    return apiRequest<PaginatedResponse<TenantUser>>(`/users?${qs}`);
  },

  createUser: (payload: Record<string, unknown>) =>
    apiRequest<TenantUser | ApiSuccess<TenantUser>>('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    }).then(unwrap),

  updateUser: (id: string, payload: Record<string, unknown>) =>
    apiRequest<TenantUser | ApiSuccess<TenantUser>>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }).then(unwrap),

  deactivateUser: (id: string, reason: string) =>
    apiRequest<{ success: true } | ApiSuccess<{ success: true }>>(`/users/${id}/deactivate`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    }).then(unwrap),

  activateUser: (id: string) =>
    apiRequest<TenantUser | ApiSuccess<TenantUser>>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ active: true }),
    }).then(unwrap),

  getCommissionRules: (activeOnly?: boolean) => {
    const qs = new URLSearchParams();
    if (activeOnly !== undefined) qs.set('activeOnly', String(activeOnly));
    const q = qs.toString();
    return apiRequest<any>(`/commission-rules${q ? `?${q}` : ''}`).then(unwrap);
  },

  deactivateCommissionRule: (id: string) =>
    apiRequest(`/commission-rules/${id}/deactivate`, { method: 'PATCH' }),

  getCurrentTenant: () =>
    apiRequest<TenantSummary | ApiSuccess<TenantSummary>>('/tenants/me').then(unwrap),

  getTenantBranches: (activeOnly?: boolean) => {
    const qs = new URLSearchParams();
    if (activeOnly !== undefined) qs.set('activeOnly', String(activeOnly));
    const q = qs.toString();
    return apiRequest<TenantBranch[] | ApiSuccess<TenantBranch[]>>(
      `/settings/branches${q ? `?${q}` : ''}`,
    ).then(unwrap);
  },

  createTenantBranch: (payload: {
    name: string;
    address?: string;
    phone?: string;
    sortOrder?: number;
  }) =>
    apiRequest<TenantBranch | ApiSuccess<TenantBranch>>('/settings/branches', {
      method: 'POST',
      body: JSON.stringify(payload),
    }).then(unwrap),

  deactivateTenantBranch: (id: string) =>
    apiRequest(`/settings/branches/${id}/deactivate`, { method: 'PATCH' }),

  getTenantSettings: () =>
    apiRequest<TenantSettingsResponse | ApiSuccess<TenantSettingsResponse>>('/settings').then(
      unwrap,
    ),

  updateTenantSettings: (settings: Record<string, unknown>) =>
    apiRequest<TenantSettingsResponse | ApiSuccess<TenantSettingsResponse>>('/settings', {
      method: 'PATCH',
      body: JSON.stringify({ settings }),
    }).then(unwrap),

  getConfigCatalog: (resource: ConfigCatalogResource, activeOnly?: boolean) => {
    const qs = new URLSearchParams();
    if (activeOnly !== undefined) qs.set('activeOnly', String(activeOnly));
    const q = qs.toString();
    return apiRequest<ConfigCatalogItem[] | ApiSuccess<ConfigCatalogItem[]>>(
      `/settings/${resource}${q ? `?${q}` : ''}`,
    ).then(unwrap);
  },

  createConfigCatalogItem: (
    resource: ConfigCatalogResource,
    payload: { name: string; code: string; sortOrder?: number; active?: boolean },
  ) =>
    apiRequest<ConfigCatalogItem | ApiSuccess<ConfigCatalogItem>>(`/settings/${resource}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }).then(unwrap),

  updateConfigCatalogItem: (
    resource: ConfigCatalogResource,
    id: string,
    payload: Partial<{ name: string; code: string; sortOrder: number; active: boolean }>,
  ) =>
    apiRequest<ConfigCatalogItem | ApiSuccess<ConfigCatalogItem>>(
      `/settings/${resource}/${id}`,
      { method: 'PATCH', body: JSON.stringify(payload) },
    ).then(unwrap),

  deactivateConfigCatalogItem: (resource: ConfigCatalogResource, id: string) =>
    apiRequest(`/settings/${resource}/${id}/deactivate`, { method: 'PATCH' }),

  getConfigStatuses: (entity: string, activeOnly?: boolean) => {
    const qs = new URLSearchParams({ entity });
    if (activeOnly !== undefined) qs.set('activeOnly', String(activeOnly));
    return apiRequest<ConfigStatusItem[] | ApiSuccess<ConfigStatusItem[]>>(
      `/settings/statuses?${qs}`,
    ).then(unwrap);
  },

  createConfigStatus: (payload: {
    entity: string;
    name: string;
    code: string;
    color?: string;
    sortOrder?: number;
    active?: boolean;
  }) =>
    apiRequest<ConfigStatusItem | ApiSuccess<ConfigStatusItem>>('/settings/statuses', {
      method: 'POST',
      body: JSON.stringify(payload),
    }).then(unwrap),

  updateConfigStatus: (
    id: string,
    payload: Partial<{
      name: string;
      code: string;
      color: string;
      sortOrder: number;
      active: boolean;
    }>,
  ) =>
    apiRequest<ConfigStatusItem | ApiSuccess<ConfigStatusItem>>(`/settings/statuses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }).then(unwrap),

  deactivateConfigStatus: (id: string) =>
    apiRequest(`/settings/statuses/${id}/deactivate`, { method: 'PATCH' }),

  getConfigEmailTemplates: (activeOnly?: boolean) => {
    const qs = new URLSearchParams();
    if (activeOnly !== undefined) qs.set('activeOnly', String(activeOnly));
    const q = qs.toString();
    return apiRequest<ConfigEmailTemplate[] | ApiSuccess<ConfigEmailTemplate[]>>(
      `/settings/email-templates${q ? `?${q}` : ''}`,
    ).then(unwrap);
  },

  createConfigEmailTemplate: (payload: {
    code: string;
    subject: string;
    bodyHtml: string;
    active?: boolean;
  }) =>
    apiRequest<ConfigEmailTemplate | ApiSuccess<ConfigEmailTemplate>>(
      '/settings/email-templates',
      { method: 'POST', body: JSON.stringify(payload) },
    ).then(unwrap),

  updateConfigEmailTemplate: (
    id: string,
    payload: Partial<{ subject: string; bodyHtml: string; active: boolean }>,
  ) =>
    apiRequest<ConfigEmailTemplate | ApiSuccess<ConfigEmailTemplate>>(
      `/settings/email-templates/${id}`,
      { method: 'PATCH', body: JSON.stringify(payload) },
    ).then(unwrap),

  deactivateConfigEmailTemplate: (id: string) =>
    apiRequest(`/settings/email-templates/${id}/deactivate`, { method: 'PATCH' }),

  getPlatformMetrics: (params?: { page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    const query = qs.toString();
    return apiRequest<PlatformMetricsResponse | ApiSuccess<PlatformMetricsResponse>>(
      `/platform/metrics${query ? `?${query}` : ''}`,
    ).then(unwrap);
  },

  createReportExport: (payload: {
    type: ExportJobResponse['type'];
    format: 'pdf' | 'xlsx';
    branchId?: string;
    sellerId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }) =>
    apiRequest<ExportJobResponse | ApiSuccess<ExportJobResponse>>('/reports/exports', {
      method: 'POST',
      body: JSON.stringify(payload),
    }).then(unwrap),

  getReportExport: (id: string) =>
    apiRequest<ExportJobResponse | ApiSuccess<ExportJobResponse>>(
      `/reports/exports/${id}`,
    ).then(unwrap),

  getProfileAccess: () =>
    apiRequest<ProfileAccessResponse | ApiSuccess<ProfileAccessResponse>>(
      '/settings/profile-access',
    ).then(unwrap),

  updateProfileAccess: (payload: { role: 'MANAGER' | 'SELLER'; enabledFeatures: string[] }) =>
    apiRequest<ProfileAccessResponse | ApiSuccess<ProfileAccessResponse>>(
      '/settings/profile-access',
      { method: 'PUT', body: JSON.stringify(payload) },
    ).then(unwrap),

  getEmailNotifications: () =>
    apiRequest<
      EmailNotificationsConfiguration | ApiSuccess<EmailNotificationsConfiguration>
    >('/settings/email-notifications').then(unwrap),

  updateEmailNotification: (
    code: string,
    payload: { active: boolean; subject: string; bodyHtml: string },
  ) =>
    apiRequest<ConfigEmailTemplate | ApiSuccess<ConfigEmailTemplate>>(
      `/settings/email-notifications/${code}`,
      { method: 'PUT', body: JSON.stringify(payload) },
    ).then(unwrap),

  updateEmailNotificationRecipients: (payload: {
    rules: Array<{ code: string; roles: Array<'ADMIN' | 'MANAGER' | 'SELLER'> }>;
  }) =>
    apiRequest<{ recipients: Record<string, string[]> } | ApiSuccess<{ recipients: Record<string, string[]> }>>(
      '/settings/email-notifications/recipients',
      { method: 'PUT', body: JSON.stringify(payload) },
    ).then(unwrap),

  getCrmFunnel: () =>
    apiRequest<CrmFunnel | ApiSuccess<CrmFunnel>>('/crm/funnel').then(unwrap),

  getCrmLeads: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    source?: string;
    sellerId?: string;
  }) => {
    const qs = new URLSearchParams({
      page: String(params?.page ?? 1),
      limit: String(params?.limit ?? 20),
    });
    if (params?.status) qs.set('status', params.status);
    if (params?.source) qs.set('source', params.source);
    if (params?.sellerId) qs.set('sellerId', params.sellerId);
    return apiRequest<PaginatedResponse<CrmLead>>(`/crm/leads?${qs}`);
  },

  getCrmLead: (id: string) =>
    apiRequest<CrmLeadDetail | ApiSuccess<CrmLeadDetail>>(`/crm/leads/${id}`).then(unwrap),

  createCrmLead: (payload: Record<string, unknown>) =>
    apiRequest<CrmLead | ApiSuccess<CrmLead>>('/crm/leads', {
      method: 'POST',
      body: JSON.stringify(payload),
    }).then(unwrap),

  updateCrmLead: (id: string, payload: Record<string, unknown>) =>
    apiRequest<CrmLead | ApiSuccess<CrmLead>>(`/crm/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }).then(unwrap),

  createCrmLeadContact: (leadId: string, payload: Record<string, unknown>) =>
    apiRequest(`/crm/leads/${leadId}/contacts`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }).then(unwrap),

  createCrmLeadInterest: (leadId: string, payload: { vehicleId: string; notes?: string }) =>
    apiRequest(`/crm/leads/${leadId}/interests`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }).then(unwrap),

  getCrmOpportunities: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    sellerId?: string;
  }) => {
    const qs = new URLSearchParams({
      page: String(params?.page ?? 1),
      limit: String(params?.limit ?? 20),
    });
    if (params?.status) qs.set('status', params.status);
    if (params?.sellerId) qs.set('sellerId', params.sellerId);
    return apiRequest<PaginatedResponse<CrmOpportunity>>(`/crm/opportunities?${qs}`);
  },

  getCrmReminders: (params?: { page?: number; limit?: number; status?: string }) => {
    const qs = new URLSearchParams({
      page: String(params?.page ?? 1),
      limit: String(params?.limit ?? 20),
    });
    if (params?.status) qs.set('status', params.status);
    return apiRequest<PaginatedResponse<CrmReminder>>(`/crm/reminders?${qs}`);
  },

  completeCrmReminder: (id: string) =>
    apiRequest(`/crm/reminders/${id}/complete`, { method: 'PATCH' }).then(unwrap),

  getVehicleDocuments: (vehicleId: string) =>
    apiRequest<VehicleDocument[] | ApiSuccess<VehicleDocument[]>>(
      `/vehicles/${vehicleId}/documents`,
    ).then(unwrap),

  uploadVehicleDocument: (vehicleId: string, file: File, documentType: VehicleDocumentType) => {
    const form = new FormData();
    form.append('file', file);
    form.append('documentType', documentType);
    return apiFormRequest<VehicleDocument>(`/vehicles/${vehicleId}/documents`, {
      method: 'POST',
      body: form,
    });
  },

  deleteVehicleDocument: (vehicleId: string, documentId: string) =>
    apiRequest(`/vehicles/${vehicleId}/documents/${documentId}`, { method: 'DELETE' }),
};
