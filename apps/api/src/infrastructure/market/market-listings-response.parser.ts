import { ParsedPortalPayload } from './market-listings.types';

const PRICE_KEYS = [
  'averageListingPrice',
  'averagePrice',
  'avgPrice',
  'precoMedio',
  'preco_medio',
  'valorMedio',
  'valor',
  'price',
  'preco',
  'listingPrice',
  'amount',
] as const;

const LISTING_ARRAY_KEYS = [
  'listings',
  'anuncios',
  'ads',
  'results',
  'items',
  'data',
  'ofertas',
] as const;

export function parseMarketListingsPayload(payload: unknown): ParsedPortalPayload | null {
  if (payload === null || payload === undefined) {
    return null;
  }

  if (typeof payload === 'number' && payload > 0) {
    return {
      averageListingPrice: Math.round(payload),
      sampleCount: 1,
      minPrice: payload,
      maxPrice: payload,
    };
  }

  if (Array.isArray(payload)) {
    return aggregatePrices(extractPricesFromList(payload));
  }

  if (typeof payload !== 'object') {
    return null;
  }

  const record = payload as Record<string, unknown>;

  const directPrice = readDirectAggregate(record);
  if (directPrice) {
    return directPrice;
  }

  const nestedData = record.data;
  if (nestedData && typeof nestedData === 'object' && !Array.isArray(nestedData)) {
    const nestedAggregate = readDirectAggregate(nestedData as Record<string, unknown>);
    if (nestedAggregate) {
      return nestedAggregate;
    }
  }

  for (const key of LISTING_ARRAY_KEYS) {
    const list = record[key];
    if (Array.isArray(list)) {
      const parsed = aggregatePrices(extractPricesFromList(list));
      if (parsed) {
        return parsed;
      }
    }
  }

  const sources = record.sources ?? record.portals ?? record.providers;
  if (Array.isArray(sources)) {
    const quotes = sources
      .map((source) => parseSourceEntry(source))
      .filter((entry): entry is ParsedPortalPayload => entry !== null);

    if (quotes.length > 0) {
      return mergeParsedQuotes(quotes);
    }
  }

  return null;
}

function readDirectAggregate(record: Record<string, unknown>): ParsedPortalPayload | null {
  const averageListingPrice = readNumber(record, ...PRICE_KEYS);
  if (!averageListingPrice || averageListingPrice <= 0) {
    return null;
  }

  const sampleCount = readNumber(record, 'sampleCount', 'quantidade', 'count', 'total') ?? 1;
  const minPrice = readNumber(record, 'minPrice', 'precoMinimo', 'minimumPrice', 'min');
  const maxPrice = readNumber(record, 'maxPrice', 'precoMaximo', 'maximumPrice', 'max');

  return {
    averageListingPrice: Math.round(averageListingPrice),
    sampleCount: Math.max(1, Math.round(sampleCount)),
    minPrice: minPrice ? Math.round(minPrice) : null,
    maxPrice: maxPrice ? Math.round(maxPrice) : null,
  };
}

function parseSourceEntry(source: unknown): ParsedPortalPayload | null {
  if (!source || typeof source !== 'object') {
    return null;
  }

  return readDirectAggregate(source as Record<string, unknown>);
}

function extractPricesFromList(list: unknown[]): number[] {
  const prices: number[] = [];

  for (const item of list) {
    if (typeof item === 'number' && item > 0) {
      prices.push(item);
      continue;
    }

    if (!item || typeof item !== 'object') {
      continue;
    }

    const record = item as Record<string, unknown>;
    const price = readNumber(record, ...PRICE_KEYS);
    if (price && price > 0) {
      prices.push(price);
    }
  }

  return prices;
}

function aggregatePrices(prices: number[]): ParsedPortalPayload | null {
  if (prices.length === 0) {
    return null;
  }

  const total = prices.reduce((sum, price) => sum + price, 0);

  return {
    averageListingPrice: Math.round(total / prices.length),
    sampleCount: prices.length,
    minPrice: Math.round(Math.min(...prices)),
    maxPrice: Math.round(Math.max(...prices)),
  };
}

function mergeParsedQuotes(quotes: ParsedPortalPayload[]): ParsedPortalPayload {
  const totalSamples = quotes.reduce((sum, quote) => sum + quote.sampleCount, 0);
  const weightedAverage =
    quotes.reduce(
      (sum, quote) => sum + quote.averageListingPrice * quote.sampleCount,
      0,
    ) / Math.max(totalSamples, 1);

  const mins = quotes.map((quote) => quote.minPrice).filter((value): value is number => value !== null);
  const maxs = quotes.map((quote) => quote.maxPrice).filter((value): value is number => value !== null);

  return {
    averageListingPrice: Math.round(weightedAverage),
    sampleCount: totalSamples,
    minPrice: mins.length ? Math.min(...mins) : null,
    maxPrice: maxs.length ? Math.max(...maxs) : null,
  };
}

function readNumber(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (value === null || value === undefined || value === '') {
      continue;
    }

    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}
