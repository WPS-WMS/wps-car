import { z } from 'zod';

export const saleStatusValues = [
  'NEGOTIATION',
  'SOLD',
  'CANCELLED',
  'AWAITING_PAYMENT',
  'COMPLETED',
] as const;

export type SaleStatusValue = (typeof saleStatusValues)[number];

export const saleFormSchema = z.object({
  vehicleId: z.string().uuid('Selecione o veículo'),
  customerId: z.string().uuid('Selecione o cliente'),
  sellerId: z.string().optional(),
  amount: z.number().min(0.01, 'Valor de venda é obrigatório'),
  paymentMethod: z.string().min(1, 'Forma de pagamento é obrigatória'),
  saleDate: z.string().min(1, 'Data da venda é obrigatória'),
  status: z.enum(saleStatusValues),
  notes: z.string().max(2000).optional(),
});

export type SaleFormValues = z.infer<typeof saleFormSchema>;

export function emptySaleForm(defaultSellerId = ''): SaleFormValues {
  return {
    vehicleId: '',
    customerId: '',
    sellerId: defaultSellerId,
    amount: 0,
    paymentMethod: 'PIX',
    saleDate: new Date().toISOString().slice(0, 10),
    status: 'NEGOTIATION',
    notes: '',
  };
}

export function toCreateSalePayload(values: SaleFormValues, isManager: boolean) {
  return {
    vehicleId: values.vehicleId,
    customerId: values.customerId,
    ...(isManager && values.sellerId ? { sellerId: values.sellerId } : {}),
    amount: values.amount,
    paymentMethod: values.paymentMethod,
    saleDate: new Date(values.saleDate).toISOString(),
    status: values.status,
    notes: values.notes?.trim() || undefined,
  };
}

export function toUpdateSalePayload(values: SaleFormValues, isManager: boolean) {
  return {
    customerId: values.customerId,
    ...(isManager && values.sellerId ? { sellerId: values.sellerId } : {}),
    amount: values.amount,
    paymentMethod: values.paymentMethod,
    saleDate: new Date(values.saleDate).toISOString(),
    status: values.status,
    notes: values.notes?.trim() || undefined,
  };
}
