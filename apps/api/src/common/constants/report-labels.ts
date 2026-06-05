import { PaymentMethod, SaleStatus, VehicleStatus } from '@prisma/client';

export const vehicleStatusReportLabels: Record<VehicleStatus, string> = {
  IN_STOCK: 'Em estoque',
  RESERVED: 'Reservado',
  SOLD: 'Vendido',
  IN_PREPARATION: 'Em preparação',
  IN_MAINTENANCE: 'Em manutenção',
  UNAVAILABLE: 'Indisponível',
};

export const saleStatusReportLabels: Record<SaleStatus, string> = {
  NEGOTIATION: 'Em negociação',
  AWAITING_PAYMENT: 'Aguardando pagamento',
  SOLD: 'Vendido',
  COMPLETED: 'Finalizado',
  CANCELLED: 'Cancelado',
};

export const paymentMethodReportLabels: Record<PaymentMethod, string> = {
  CASH: 'Dinheiro',
  PIX: 'PIX',
  BANK_TRANSFER: 'Transferência',
  CREDIT_CARD: 'Cartão crédito',
  DEBIT_CARD: 'Cartão débito',
  FINANCING: 'Financiamento',
  CHECK: 'Cheque',
  TRADE_IN: 'Troca',
  OTHER: 'Outro',
};
