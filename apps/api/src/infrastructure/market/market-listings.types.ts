export type MarketPortalEndpoint = {
  name: string;
  url: string;
};

export type MarketPortalQuote = {
  portal: string;
  averageListingPrice: number;
  sampleCount: number;
  minPrice: number | null;
  maxPrice: number | null;
  error?: string;
};

export type MarketListingsResult = {
  provider: string;
  referenceMonth: string;
  averageListingPrice: number;
  sampleCount: number;
  portals: string[];
  portalQuotes: MarketPortalQuote[];
  raw?: unknown;
};

export type ParsedPortalPayload = {
  averageListingPrice: number;
  sampleCount: number;
  minPrice: number | null;
  maxPrice: number | null;
};
