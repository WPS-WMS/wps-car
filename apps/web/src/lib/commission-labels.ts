export const commissionTypeOptions = [
  { value: 'SALE_PERCENTAGE', label: 'Percentual sobre valor de venda' },
  { value: 'PROFIT_PERCENTAGE', label: 'Percentual sobre lucro' },
  { value: 'FIXED_AMOUNT', label: 'Valor fixo por venda' },
  { value: 'CUSTOM_PER_VEHICLE', label: 'Comissão personalizada por veículo' },
] as const;

export function isPercentageCommission(type: string) {
  return type === 'SALE_PERCENTAGE' || type === 'PROFIT_PERCENTAGE';
}

