import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  setAuthSession,
} from './auth-storage';
import { api } from './api';
import type { ExportJobResponse, LoginResponse } from '@/types/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
const POLL_INTERVAL_MS = 1500;
const MAX_POLL_ATTEMPTS = 120;

type ReportType = 'stock' | 'sales' | 'summary';

const exportTypes: Record<ReportType, ExportJobResponse['type']> = {
  stock: 'STOCK',
  sales: 'SALES',
  summary: 'SUMMARY',
};

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

async function fetchWithAuth(url: string, init?: RequestInit) {
  const fetchOnce = async (token: string | null) =>
    fetch(url, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

  let token = getAccessToken();
  let response = await fetchOnce(token);

  if (response.status === 401) {
    token = await refreshAccessToken();
    if (token) response = await fetchOnce(token);
  }

  return response;
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

async function waitForExportJob(
  jobId: string,
  onProgress?: (status: ExportJobResponse['status']) => void,
): Promise<ExportJobResponse> {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
    const job = await api.getReportExport(jobId);
    onProgress?.(job.status);

    if (job.status === 'COMPLETED') {
      return job;
    }

    if (job.status === 'FAILED') {
      throw new Error(job.errorMessage ?? 'Falha ao gerar exportação');
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error('Tempo esgotado aguardando a exportação');
}

/** Exportação assíncrona com polling — evita timeout em relatórios grandes. */
export async function downloadReportAsync(
  report: ReportType,
  format: 'pdf' | 'xlsx',
  params?: Record<string, string | undefined>,
  onProgress?: (message: string) => void,
) {
  onProgress?.('Enfileirando exportação…');

  const job = await api.createReportExport({
    type: exportTypes[report],
    format,
    branchId: params?.branchId,
    sellerId: params?.sellerId,
    startDate: params?.startDate,
    endDate: params?.endDate,
    status: params?.status,
  });

  const completed = await waitForExportJob(job.id, (status) => {
    if (status === 'PROCESSING') {
      onProgress?.('Gerando relatório…');
    }
  });

  onProgress?.('Baixando arquivo…');

  const response = await fetchWithAuth(`${API_URL}/reports/exports/${job.id}/download`);

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message =
      (body as { message?: string | string[] }).message ?? 'Falha ao baixar exportação';
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }

  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition');
  const match = disposition?.match(/filename="(.+)"/);
  const stamp = new Date().toISOString().slice(0, 10);
  const fallback = `${report}-${stamp}.${format}`;
  const finalName = match?.[1] ?? completed.fileName ?? fallback;

  triggerBlobDownload(blob, finalName);
}

/** @deprecated Prefer downloadReportAsync para relatórios grandes */
export async function downloadReport(
  path: string,
  filename: string,
  params?: Record<string, string | undefined>,
) {
  const qs = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([k, v]) => {
    if (v) qs.set(k, v);
  });
  const url = `${API_URL}${path}${qs.toString() ? `?${qs}` : ''}`;

  const response = await fetchWithAuth(url);

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message =
      (body as { message?: string | string[] }).message ?? 'Falha ao exportar relatório';
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }

  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition');
  const match = disposition?.match(/filename="(.+)"/);
  const finalName = match?.[1] ?? filename;

  triggerBlobDownload(blob, finalName);
}
