import { z } from 'zod';

export const vehicleFinancialFormSchema = z.object({
  purchaseValue: z.number().min(0.01, 'Valor de compra é obrigatório'),
  purchaseDate: z.string().optional(),
  supplierId: z.string().optional(),
  fipeValue: z.number().min(0).optional(),
  suggestedPurchaseValue: z.number().min(0).optional(),
  listedValue: z.number().min(0).optional(),
  minimumValue: z.number().min(0).optional(),
  saleValue: z.number().min(0).optional(),
  saleDate: z.string().optional(),
  customerId: z.string().optional(),
  sellerId: z.string().optional(),
});

export type VehicleFinancialFormValues = z.infer<typeof vehicleFinancialFormSchema>;

export function parseDecimalField(value: string | null | undefined): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const n = parseFloat(value);
  return Number.isNaN(n) ? undefined : n;
}

export function toFinancialFormValues(
  data: import('@/types/api').VehicleFinancialDetail,
): VehicleFinancialFormValues {
  return {
    purchaseValue: parseFloat(data.purchaseValue) || 0,
    purchaseDate: data.purchaseDate
      ? new Date(data.purchaseDate).toISOString().slice(0, 10)
      : '',
    supplierId: data.supplierId ?? '',
    fipeValue: parseDecimalField(data.fipeValue),
    suggestedPurchaseValue: parseDecimalField(data.suggestedPurchaseValue),
    listedValue: parseDecimalField(data.listedValue),
    minimumValue: parseDecimalField(data.minimumValue),
    saleValue: parseDecimalField(data.saleValue),
    saleDate: data.saleDate ? new Date(data.saleDate).toISOString().slice(0, 10) : '',
    customerId: data.customerId ?? '',
    sellerId: data.sellerId ?? '',
  };
}

export function toFinancialUpdatePayload(values: VehicleFinancialFormValues) {
  return {
    purchaseValue: values.purchaseValue,
    purchaseDate: values.purchaseDate
      ? new Date(values.purchaseDate).toISOString()
      : undefined,
    supplierId: values.supplierId || undefined,
    fipeValue: values.fipeValue,
    suggestedPurchaseValue: values.suggestedPurchaseValue,
    listedValue: values.listedValue,
    minimumValue: values.minimumValue,
    saleValue: values.saleValue,
    saleDate: values.saleDate ? new Date(values.saleDate).toISOString() : undefined,
    customerId: values.customerId || undefined,
    sellerId: values.sellerId || undefined,
  };
}
