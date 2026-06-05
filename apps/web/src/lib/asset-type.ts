/** Tipo de bem cadastrado no estoque (veículo ou produto). */
export const PRODUCT_TYPE = 'PRODUCT' as const;

export type AssetType =
  | 'CAR'
  | 'MOTORCYCLE'
  | 'TRUCK'
  | 'UTILITY'
  | typeof PRODUCT_TYPE
  | 'OTHER';

export function isProductType(type: string | undefined): boolean {
  return type === PRODUCT_TYPE;
}

export function assetTypeLabel(type: string): string {
  if (isProductType(type)) return 'produto';
  return 'veículo';
}

export function assetTypeLabelCapitalized(type: string): string {
  if (isProductType(type)) return 'Produto';
  return 'Veículo';
}
