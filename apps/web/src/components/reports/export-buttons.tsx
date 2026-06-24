'use client';

import { useState } from 'react';
import { FileDown, FileSpreadsheet } from 'lucide-react';
import { downloadReportAsync } from '@/lib/download';
import { Button } from '@/components/ui/button';

type ReportType = 'stock' | 'sales' | 'summary';

export function ExportButtons({
  report,
  params,
}: {
  report: ReportType;
  params?: Record<string, string | undefined>;
}) {
  const [loading, setLoading] = useState<'pdf' | 'xlsx' | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleExport(format: 'pdf' | 'xlsx') {
    setError(null);
    setProgress(null);
    setLoading(format);
    try {
      await downloadReportAsync(report, format, params, setProgress);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao exportar');
    } finally {
      setLoading(null);
      setProgress(null);
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
      {progress ? (
        <p className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">{progress}</p>
      ) : null}
      {error ? (
        <p className="rounded-md bg-red-50 px-2 py-1 text-xs text-red-700">{error}</p>
      ) : null}
    </div>
  );
}
