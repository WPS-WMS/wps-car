import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  setAuthSession,
} from './auth-storage';
import type { LoginResponse } from '@/types/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

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
  setAuthSession(data.accessToken, data.refreshToken, data.user);
  return data.accessToken;
}

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

  const fetchWithAuth = async (token: string | null) =>
    fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

  let token = getAccessToken();
  let response = await fetchWithAuth(token);

  if (response.status === 401) {
    token = await refreshAccessToken();
    if (token) response = await fetchWithAuth(token);
  }

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

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = finalName;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}
