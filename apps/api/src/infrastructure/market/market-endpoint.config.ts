import { MarketPortalEndpoint } from './market-listings.types';

type MarketHttpConfig = {
  endpoints: MarketPortalEndpoint[];
  headers: Record<string, string>;
  timeoutMs: number;
  minSuccess: number;
};

export function resolveMarketHttpConfig(env: {
  httpUrl?: string;
  httpUrls?: string;
  httpHeaders?: string;
  httpApiKey?: string;
  httpTimeoutMs?: number;
  httpMinSuccess?: number;
}): MarketHttpConfig {
  const endpoints = parseEndpoints(env.httpUrls, env.httpUrl);
  const headers = parseHeaders(env.httpHeaders, env.httpApiKey);

  return {
    endpoints,
    headers,
    timeoutMs: env.httpTimeoutMs ?? 8000,
    minSuccess: Math.max(1, env.httpMinSuccess ?? 1),
  };
}

function parseEndpoints(httpUrls?: string, legacyHttpUrl?: string): MarketPortalEndpoint[] {
  if (httpUrls?.trim()) {
    try {
      const parsed = JSON.parse(httpUrls) as unknown;
      if (Array.isArray(parsed)) {
        const endpoints = parsed
          .map((entry, index) => normalizeEndpoint(entry, index))
          .filter((entry): entry is MarketPortalEndpoint => entry !== null);

        if (endpoints.length > 0) {
          return endpoints;
        }
      }
    } catch {
      // fallback to comma-separated name|url pairs
      const fallback = httpUrls
        .split(',')
        .map((chunk, index) => {
          const [name, url] = chunk.split('|').map((part) => part.trim());
          if (!url) {
            return null;
          }

          return {
            name: name || `Portal ${index + 1}`,
            url,
          };
        })
        .filter((entry): entry is MarketPortalEndpoint => entry !== null);

      if (fallback.length > 0) {
        return fallback;
      }
    }
  }

  if (legacyHttpUrl?.trim()) {
    return [{ name: 'Agregador', url: legacyHttpUrl.trim() }];
  }

  return [];
}

function normalizeEndpoint(entry: unknown, index: number): MarketPortalEndpoint | null {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const record = entry as Record<string, unknown>;
  const url = String(record.url ?? record.endpoint ?? '').trim();
  if (!url) {
    return null;
  }

  const name = String(record.name ?? record.portal ?? record.provider ?? `Portal ${index + 1}`).trim();

  return { name, url };
}

function parseHeaders(httpHeaders?: string, httpApiKey?: string) {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (httpHeaders?.trim()) {
    try {
      const parsed = JSON.parse(httpHeaders) as Record<string, unknown>;
      for (const [key, value] of Object.entries(parsed)) {
        if (value !== undefined && value !== null && String(value).trim()) {
          headers[key] = String(value);
        }
      }
    } catch {
      // ignore invalid JSON
    }
  }

  if (httpApiKey?.trim() && !headers['X-Api-Key'] && !headers.Authorization) {
    headers['X-Api-Key'] = httpApiKey.trim();
  }

  return headers;
}

export function buildMarketRequestUrl(
  template: string,
  params: {
    brand: string;
    model: string;
    modelYear: number;
    mileage?: number | null;
    fipeValue?: number | null;
  },
) {
  const replacements: Record<string, string> = {
    brand: encodeURIComponent(params.brand),
    model: encodeURIComponent(params.model),
    year: encodeURIComponent(String(params.modelYear)),
    modelYear: encodeURIComponent(String(params.modelYear)),
    mileage: encodeURIComponent(String(params.mileage ?? '')),
    fipeValue: encodeURIComponent(String(params.fipeValue ?? '')),
  };

  return Object.entries(replacements).reduce(
    (url, [key, value]) => url.replaceAll(`{${key}}`, value),
    template,
  );
}
