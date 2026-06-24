import { PricingIntelligenceQuery } from '@prisma/client';
import { decimalToString } from '../../common/utils/decimal.util';

export function toPricingIntelligenceQueryResponse(row: PricingIntelligenceQuery) {
  const raw =
    row.rawResponse && typeof row.rawResponse === 'object'
      ? (row.rawResponse as Record<string, unknown>)
      : {};

  return {
    id: row.id,
    vehicleId: row.vehicleId,
    vehicleLabel: raw.vehicleLabel ? String(raw.vehicleLabel) : null,
    fipeValue: decimalToString(row.fipeValue),
    marketReference: decimalToString(row.marketReference),
    minMarginPercent: Number(row.minMarginPercent.toString()),
    suggestions: {
      conservative: decimalToString(row.conservativePrice),
      competitive: decimalToString(row.competitivePrice),
      aggressive: decimalToString(row.aggressivePrice),
      idealListing: decimalToString(row.idealListingPrice),
      minimumRecommended: decimalToString(row.minimumRecommended),
    },
    createdAt: row.createdAt.toISOString(),
  };
}
