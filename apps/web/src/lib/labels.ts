export const vehicleTypeLabels: Record<string, string> = {
  CAR: 'Carro',
  MOTORCYCLE: 'Moto',
  TRUCK: 'Caminhão',
  UTILITY: 'Utilitário',
  PRODUCT: 'Produto',
  OTHER: 'Outros',
};

export const fuelTypeLabels: Record<string, string> = {
  GASOLINE: 'Gasolina',
  ETHANOL: 'Etanol',
  FLEX: 'Flex',
  DIESEL: 'Diesel',
  ELECTRIC: 'Elétrico',
  HYBRID: 'Híbrido',
  GNV: 'GNV',
  OTHER: 'Outro',
};

export const transmissionLabels: Record<string, string> = {
  MANUAL: 'Manual',
  AUTOMATIC: 'Automático',
  CVT: 'CVT',
  AUTOMATED_MANUAL: 'Automatizado',
  OTHER: 'Outro',
};

export const vehicleCategoryLabels: Record<string, string> = {
  HATCH: 'Hatch',
  SEDAN: 'Sedan',
  SUV: 'SUV',
  PICKUP: 'Picape',
  VAN: 'Van',
  COUPE: 'Cupê',
  WAGON: 'Perua',
  OTHER: 'Outro',
};

export const vehicleStatusLabels: Record<string, string> = {
  IN_STOCK: 'Em estoque',
  RESERVED: 'Reservado',
  SOLD: 'Vendido',
  IN_PREPARATION: 'Em preparação',
  IN_MAINTENANCE: 'Em manutenção',
  UNAVAILABLE: 'Indisponível',
};

export const saleStatusLabels: Record<string, string> = {
  NEGOTIATION: 'Em negociação',
  AWAITING_PAYMENT: 'Aguardando pagamento',
  SOLD: 'Vendido',
  COMPLETED: 'Finalizado',
  CANCELLED: 'Cancelado',
};

export const paymentMethodLabels: Record<string, string> = {
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

export function saleStatusVariant(
  status: string,
): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' {
  switch (status) {
    case 'COMPLETED':
    case 'SOLD':
      return 'success';
    case 'NEGOTIATION':
    case 'AWAITING_PAYMENT':
      return 'warning';
    case 'CANCELLED':
      return 'destructive';
    default:
      return 'secondary';
  }
}

export function vehicleStatusVariant(
  status: string,
): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' {
  switch (status) {
    case 'IN_STOCK':
      return 'success';
    case 'RESERVED':
      return 'warning';
    case 'SOLD':
      return 'default';
    case 'IN_MAINTENANCE':
    case 'IN_PREPARATION':
      return 'secondary';
    default:
      return 'secondary';
  }
}

export const vehicleCostTypeLabels: Record<string, string> = {
  PAINTING: 'Pintura',
  MECHANICS: 'Mecânica',
  BODYWORK: 'Funilaria',
  SANITIZATION: 'Higienização',
  DOCUMENTATION: 'Documentação',
  DISPATCHER: 'Despachante',
  TRANSPORT: 'Transporte',
  TOWING: 'Guincho',
  ADVERTISING: 'Publicidade',
  COMMISSION: 'Comissão',
  WASHING: 'Lavagem',
  REVISION: 'Revisão',
  OTHER: 'Outros',
};

export const stockMovementTypeLabels: Record<string, string> = {
  ENTRY: 'Entrada',
  EXIT: 'Saída',
  ADJUSTMENT: 'Ajuste',
  RESERVATION: 'Reserva',
  RELEASE: 'Liberação',
};
