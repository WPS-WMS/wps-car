export function formatCurrency(value: string | number | null | undefined) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num === null || num === undefined || Number.isNaN(num)) return '—';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num);
}

export function formatDate(date: string | Date | null | undefined) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
}

export function formatPercent(value: string | number | null | undefined, decimals = 2) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num === null || num === undefined || Number.isNaN(num)) return '—';
  return `${num.toFixed(decimals)}%`;
}

/** Valor monetário para campos de formulário (pt-BR: 12.345,67). */
export function formatCurrencyInput(value: number | undefined | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) return '';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Converte texto digitado com máscara BRL em número. */
export function parseCurrencyInput(input: string): number | undefined {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 0) return undefined;
  return Number(digits) / 100;
}
