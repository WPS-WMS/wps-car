'use client';

import { useState } from 'react';
import { FileDown, FileSpreadsheet } from 'lucide-react';
import { downloadReport } from '@/lib/download';
import { Button } from '@/components/ui/button';

type ReportType = 'stock' | 'sales' | 'summary';

const paths: Record<ReportType, string> = {
  stock: '/reports/stock/export',
  sales: '/reports/sales/export',
  summary: '/reports/summary/export',
};

const baseNames: Record<ReportType, string> = {
  stock: 'estoque',
  sales: 'vendas',
  summary: 'resumo-gerencial',
};

export function ExportButtons({
  report,
  params,
}: {
  report: ReportType;
  params?: Record<string, string | undefined>;
}) {
  const [loading, setLoading] = useState<'pdf' | 'xlsx' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleExport(format: 'pdf' | 'xlsx') {
    setError(null);
    setLoading(format);
    try {
      const stamp = new Date().toISOString().slice(0, 10);
      await downloadReport(paths[report], `${baseNames[report]}-${stamp}.${format}`, {
        format,
        ...params,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao exportar');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading !== null}
          onClick={() => handleExport('pdf')}
        >
          <FileDown className="h-4 w-4" />
          {loading === 'pdf' ? 'Gerando PDF…' : 'PDF'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading !== null}
          onClick={() => handleExport('xlsx')}
        >
          <FileSpreadsheet className="h-4 w-4" />
          {loading === 'xlsx' ? 'Gerando Excel…' : 'Excel'}
        </Button>
      </div>
      {error ? (
        <p className="rounded-md bg-red-50 px-2 py-1 text-xs text-red-700">{error}</p>
      ) : null}
    </div>
  );
}
