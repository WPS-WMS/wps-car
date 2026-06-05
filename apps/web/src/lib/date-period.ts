export type PeriodPreset = 'day' | 'month' | 'year' | 'custom';

export interface PeriodFilterValue {
  preset: PeriodPreset;
  customFrom: string;
  customTo: string;
}

export interface DatePeriodRange {
  startDate: string;
  endDate: string;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function formatYmd(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayYmd(): string {
  return formatYmd(new Date());
}

export function defaultCustomRange(): { from: string; to: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: formatYmd(start), to: formatYmd(now) };
}

export function defaultPeriodFilter(): PeriodFilterValue {
  const { from, to } = defaultCustomRange();
  return { preset: 'month', customFrom: from, customTo: to };
}

function toIsoStart(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  // Importante: usamos UTC para não “cortar” registros por fuso horário
  // quando o backend persiste datas como meia-noite UTC (ex.: "2026-05-28T00:00:00.000Z").
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0)).toISOString();
}

function toIsoEnd(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999)).toISOString();
}

export function resolvePeriodRange(
  filter: PeriodFilterValue,
  reference = new Date(),
): DatePeriodRange | null {
  const ref = reference;

  if (filter.preset === 'day') {
    const ymd = formatYmd(ref);
    return { startDate: toIsoStart(ymd), endDate: toIsoEnd(ymd) };
  }

  if (filter.preset === 'month') {
    const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
    return {
      startDate: toIsoStart(formatYmd(start)),
      endDate: toIsoEnd(formatYmd(end)),
    };
  }

  if (filter.preset === 'year') {
    const start = new Date(ref.getFullYear(), 0, 1);
    const end = new Date(ref.getFullYear(), 11, 31);
    return {
      startDate: toIsoStart(formatYmd(start)),
      endDate: toIsoEnd(formatYmd(end)),
    };
  }

  if (!filter.customFrom || !filter.customTo) return null;
  if (filter.customFrom > filter.customTo) return null;

  return {
    startDate: toIsoStart(filter.customFrom),
    endDate: toIsoEnd(filter.customTo),
  };
}

export function periodMetricTitles(preset: PeriodPreset) {
  switch (preset) {
    case 'day':
      return {
        sales: 'Vendas do dia',
        revenue: 'Receita do dia',
        profit: 'Lucro do dia',
      };
    case 'month':
      return {
        sales: 'Vendas do mês',
        revenue: 'Receita do mês',
        profit: 'Lucro do mês',
      };
    case 'year':
      return {
        sales: 'Vendas do ano',
        revenue: 'Receita do ano',
        profit: 'Lucro do ano',
      };
    case 'custom':
      return {
        sales: 'Vendas no período',
        revenue: 'Receita no período',
        profit: 'Lucro no período',
      };
  }
}

export function formatPeriodDescription(
  filter: PeriodFilterValue,
  range: DatePeriodRange | null,
): string {
  if (!range) {
    if (filter.preset === 'custom') {
      if (filter.customFrom && filter.customTo && filter.customFrom > filter.customTo) {
        return 'Data inicial não pode ser maior que a final';
      }
      return 'Selecione o período de-até';
    }
    return '';
  }

  const parseLocalFromIso = (iso: string) => {
    const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const start = parseLocalFromIso(range.startDate);
  const end = parseLocalFromIso(range.endDate);

  if (filter.preset === 'day') {
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(start);
  }

  const fmt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}
