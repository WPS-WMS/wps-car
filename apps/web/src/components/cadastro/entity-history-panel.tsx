'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { historyActionLabels } from '@/lib/person-labels';
import type { EntityHistoryEntry } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type HistoryApi = {
  getHistory: (id: string, page?: number) => Promise<{ data: EntityHistoryEntry[]; meta: { totalPages: number } }>;
  addNote: (id: string, note: string) => Promise<unknown>;
};

export function EntityHistoryPanel({
  entityId,
  queryKeyPrefix,
  api,
  canAddNote,
  title = 'Histórico',
}: {
  entityId: string;
  queryKeyPrefix: string;
  api: HistoryApi;
  canAddNote: boolean;
  title?: string;
}) {
  const [note, setNote] = useState('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const historyQuery = useQuery({
    queryKey: [queryKeyPrefix, entityId, 'history', page],
    queryFn: () => api.getHistory(entityId, page),
  });

  const addMutation = useMutation({
    mutationFn: () => api.addNote(entityId, note.trim()),
    onSuccess: () => {
      toast.success('Observação registrada');
      setNote('');
      queryClient.invalidateQueries({ queryKey: [queryKeyPrefix, entityId, 'history'] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao salvar observação');
    },
  });

  const entries = historyQuery.data?.data ?? [];
  const meta = historyQuery.data?.meta;

  function noteText(entry: EntityHistoryEntry) {
    const details = entry.details;
    if (details && typeof details.note === 'string') return details.note;
    if (details && typeof details.message === 'string') return details.message;
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Registro de alterações e observações</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {canAddNote ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Nova observação…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              disabled={!note.trim() || addMutation.isPending}
              onClick={() => addMutation.mutate()}
            >
              {addMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Adicionar'
              )}
            </Button>
          </div>
        ) : null}

        {historyQuery.isLoading ? (
          <p className="text-sm text-brand-600">Carregando histórico…</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-brand-600">Nenhum registro ainda.</p>
        ) : (
          <ul className="divide-y divide-brand-100 rounded-lg border border-brand-100">
            {entries.map((entry) => (
              <li key={entry.id} className="px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-brand-900">
                    {historyActionLabels[entry.action] ?? entry.action}
                  </span>
                  <span className="text-xs text-brand-600">
                    {formatDate(entry.createdAt)}
                  </span>
                </div>
                {noteText(entry) ? (
                  <p className="mt-1 text-brand-700">{noteText(entry)}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {meta && meta.totalPages > 1 ? (
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
