'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Gauge,
  History,
  Loader2,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { vehicleEditHref } from '@/lib/edit-routes';
import { formatCurrency, formatDate } from '@/lib/format';
import type { PricingIntelligenceAnalysis } from '@/types/api';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/vehicles/form-field';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

const SUGGESTION_META = [
  {
    key: 'conservative' as const,
    label: 'Conservador',
    hint: 'Maior margem, venda mais lenta',
    icon: TrendingUp,
    tone: 'border-blue-200 bg-blue-50/60',
  },
  {
    key: 'competitive' as const,
    label: 'Competitivo',
    hint: 'Alinhado ao mercado',
    icon: Target,
    tone: 'border-emerald-200 bg-emerald-50/60',
  },
  {
    key: 'aggressive' as const,
    label: 'Agressivo',
    hint: 'Giro rápido, margem menor',
    icon: TrendingDown,
    tone: 'border-orange-200 bg-orange-50/60',
  },
  {
    key: 'idealListing' as const,
    label: 'Ideal de anúncio',
    hint: 'Sugestão para publicar',
    icon: Sparkles,
    tone: 'border-brand-200 bg-brand-50/60',
  },
  {
    key: 'minimumRecommended' as const,
    label: 'Mínimo recomendado',
    hint: 'Piso com margem mínima',
    icon: Gauge,
    tone: 'border-slate-200 bg-slate-50/60',
  },
];

function AnalysisResults({
  data,
  onApplyListing,
  canApply,
}: {
  data: PricingIntelligenceAnalysis;
  onApplyListing?: (value: number) => void;
  canApply?: boolean;
}) {
  return (
    <div className="space-y-6">
      <Card className="border border-brand-200 bg-brand-50/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-brand-700" />
            {data.vehicle.label}
          </CardTitle>
          <CardDescription>
            Referência de mercado {formatCurrency(data.context.marketReference)}
            {data.fipe.value ? ` · FIPE ${formatCurrency(data.fipe.value)}` : ''}
            {data.fipe.referenceMonth ? ` · ${data.fipe.referenceMonth}` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {SUGGESTION_META.map(({ key, label, hint, icon: Icon, tone }) => (
            <div key={key} className={cn('rounded-lg border p-4', tone)}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {label}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-foreground">
                    {formatCurrency(data.suggestions[key])}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
                </div>
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
              {key === 'idealListing' && canApply && onApplyListing ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => onApplyListing(parseFloat(data.suggestions.idealListing))}
                >
                  Usar no anúncio
                </Button>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fontes utilizadas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">FIPE</span>
              <span className="font-medium">
                {data.fipe.value ? formatCurrency(data.fipe.value) : 'Indisponível'}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Histórico interno</span>
              <span className="font-medium">
                {data.sources.internalHistory.sampleCount > 0
                  ? `${formatCurrency(data.sources.internalHistory.averageSalePrice)} (${data.sources.internalHistory.sampleCount} vendas)`
                  : 'Sem amostra'}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Estoque similar</span>
              <span className="font-medium">
                {data.sources.similarInStock.sampleCount > 0
                  ? `${formatCurrency(data.sources.similarInStock.averageListedPrice)} (${data.sources.similarInStock.sampleCount} veículos)`
                  : 'Sem amostra'}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Portais (média)</span>
              <span className="font-medium">
                {data.sources.marketPortals
                  ? `${formatCurrency(data.sources.marketPortals.averageListingPrice)} (${data.sources.marketPortals.sampleCount} anúncios)`
                  : 'Indisponível'}
              </span>
            </div>
            {data.sources.marketPortals?.portalQuotes?.length ? (
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Por portal
                </p>
                <div className="space-y-2">
                  {data.sources.marketPortals.portalQuotes.map((quote) => (
                    <div
                      key={quote.portal}
                      className="flex flex-wrap items-center justify-between gap-2 text-sm"
                    >
                      <span className="font-medium">{quote.portal}</span>
                      {quote.error ? (
                        <span className="text-destructive">{quote.error}</span>
                      ) : (
                        <span className="text-muted-foreground">
                          {formatCurrency(quote.averageListingPrice)}
                          {quote.sampleCount ? ` · ${quote.sampleCount} anúncios` : ''}
                          {quote.minPrice && quote.maxPrice
                            ? ` · ${formatCurrency(quote.minPrice)} – ${formatCurrency(quote.maxPrice)}`
                            : ''}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Tempo médio de venda</span>
              <span className="font-medium">
                {data.sources.tenantAvgDaysToSell !== null
                  ? `${data.sources.tenantAvgDaysToSell} dias`
                  : '—'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contexto financeiro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Investido</span>
              <span className="font-medium">{formatCurrency(data.context.totalInvested)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Margem mínima</span>
              <span className="font-medium">{data.context.minMarginPercent}%</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Piso financeiro</span>
              <span className="font-medium">{formatCurrency(data.context.minPriceFromMargin)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Dias em estoque</span>
              <span className="font-medium">{data.context.daysInStock ?? '—'}</span>
            </div>
            {data.context.urgencyAdjustmentPercent > 0 ? (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Ajuste de urgência</span>
                <span className="font-medium">{data.context.urgencyAdjustmentPercent}%</span>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {data.insights.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              {data.insights.map((insight) => (
                <li key={insight}>{insight}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

export function PricingIntelligencePanel({
  vehicleId: initialVehicleId,
  showVehiclePicker = false,
  onApplyListing,
  canApplyListing = false,
}: {
  vehicleId?: string;
  showVehiclePicker?: boolean;
  onApplyListing?: (value: number) => void;
  canApplyListing?: boolean;
}) {
  const queryClient = useQueryClient();
  const [vehicleId, setVehicleId] = useState(initialVehicleId ?? '');
  const [minMarginPercent, setMinMarginPercent] = useState('12');
  const [analysis, setAnalysis] = useState<PricingIntelligenceAnalysis | null>(null);

  useEffect(() => {
    if (initialVehicleId) {
      setVehicleId(initialVehicleId);
    }
  }, [initialVehicleId]);

  const stockQuery = useQuery({
    queryKey: ['stock', 'pricing-picker'],
    queryFn: () => api.getStock({ limit: 100, page: 1 }),
    enabled: showVehiclePicker,
  });

  const vehicleOptions = useMemo(
    () =>
      stockQuery.data?.data.map((item) => ({
        value: item.id,
        label: `${item.brand} ${item.model} ${item.year}${item.licensePlate ? ` · ${item.licensePlate}` : ''}`,
      })) ?? [],
    [stockQuery.data],
  );

  const historyQuery = useQuery({
    queryKey: ['pricing-intelligence', 'history', vehicleId || 'all'],
    queryFn: () =>
      api.getPricingIntelligenceHistory({
        limit: 8,
        vehicleId: vehicleId || undefined,
      }),
  });

  const analyzeMutation = useMutation({
    mutationFn: () => {
      if (!vehicleId) {
        throw new Error('Selecione um veículo');
      }

      const parsed = parseFloat(minMarginPercent.replace(',', '.'));
      return api.analyzePricingIntelligence({
        vehicleId,
        minMarginPercent: Number.isNaN(parsed) ? undefined : parsed,
      });
    },
    onSuccess: (result) => {
      setAnalysis(result);
      queryClient.invalidateQueries({ queryKey: ['pricing-intelligence', 'history'] });
      toast.success('Precificação calculada');
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Erro na análise');
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4" />
            Análise de precificação
          </CardTitle>
          <CardDescription>
            Combina FIPE, histórico da revenda, estoque similar, portais e margem mínima
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1fr_160px_auto] md:items-end">
          {showVehiclePicker ? (
            <FormField label="Veículo">
              <select
                className="flex h-10 w-full rounded-[10px] border border-input bg-white px-3 text-sm shadow-sm"
                value={vehicleId}
                onChange={(event) => {
                  setVehicleId(event.target.value);
                  setAnalysis(null);
                }}
              >
                <option value="">Selecione um veículo do estoque</option>
                {vehicleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>
          ) : null}

          <FormField label="Margem mínima (%)">
            <Input
              inputMode="decimal"
              value={minMarginPercent}
              onChange={(event) => setMinMarginPercent(event.target.value)}
            />
          </FormField>

          <Button
            type="button"
            disabled={!vehicleId || analyzeMutation.isPending}
            onClick={() => analyzeMutation.mutate()}
          >
            {analyzeMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analisando…
              </>
            ) : (
              'Calcular preços'
            )}
          </Button>
        </CardContent>
      </Card>

      {analysis ? (
        <AnalysisResults
          data={analysis}
          onApplyListing={onApplyListing}
          canApply={canApplyListing}
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Histórico recente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {historyQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando histórico…</p>
          ) : !historyQuery.data?.data.length ? (
            <p className="text-sm text-muted-foreground">Nenhuma análise registrada ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Competitivo</TableHead>
                  <TableHead>Ideal anúncio</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyQuery.data.data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{item.vehicleLabel ?? item.vehicleId}</p>
                        <Link
                          href={vehicleEditHref(item.vehicleId)}
                          className={cn(buttonVariants({ variant: 'link', size: 'sm' }), 'h-auto p-0')}
                        >
                          Abrir veículo
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(item.suggestions.competitive)}</TableCell>
                    <TableCell>{formatCurrency(item.suggestions.idealListing)}</TableCell>
                    <TableCell>{formatDate(item.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
