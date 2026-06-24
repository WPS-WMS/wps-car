'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Calculator,
  Car,
  History,
  Loader2,
  ScanSearch,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import type { PurchaseIntelligenceAnalysis } from '@/types/api';
import { vehicleEditHref } from '@/lib/edit-routes';
import { formatCurrency, formatDate, formatPercent } from '@/lib/format';
import { vehicleStatusLabels, vehicleStatusVariant } from '@/lib/labels';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
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

function normalizePlateInput(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8);
}

function AnalysisResults({ data }: { data: PurchaseIntelligenceAnalysis }) {
  return (
    <div className="space-y-6">
      <Card className="border border-brand-200 bg-brand-50/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-brand-700" />
            Análise de compra — {data.licensePlate}
          </CardTitle>
          <CardDescription>
            Fonte: {data.provider === 'mock' ? 'simulação local (FIPE)' : 'API externa'}
            {data.referenceMonth ? ` · referência ${data.referenceMonth}` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-brand-100 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Veículo identificado
            </p>
            <p className="mt-2 text-lg font-semibold text-foreground">
              {data.fipe.vehicle.brand} {data.fipe.vehicle.model}
              {data.fipe.vehicle.version ? ` ${data.fipe.vehicle.version}` : ''}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.fipe.vehicle.modelYear}/{data.fipe.vehicle.manufactureYear}
              {data.fipe.vehicle.fuel ? ` · ${data.fipe.vehicle.fuel}` : ''}
              {data.fipe.vehicle.color ? ` · ${data.fipe.vehicle.color}` : ''}
            </p>
            <p className="mt-3 text-2xl font-bold text-brand-800">
              FIPE {formatCurrency(data.fipe.value)}
            </p>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">
              Valor máximo sugerido de compra
            </p>
            <p className="mt-2 text-3xl font-bold text-emerald-900">
              {formatCurrency(data.analysis.maxPurchaseValue)}
            </p>
            <p className="mt-2 text-sm text-emerald-900/80">{data.analysis.formula}</p>
            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-emerald-800/80">Margem desejada</dt>
                <dd className="font-semibold">{formatPercent(data.analysis.desiredMarginPercent)}</dd>
              </div>
              <div>
                <dt className="text-emerald-800/80">Margem em R$</dt>
                <dd className="font-semibold">{formatCurrency(data.analysis.marginAmount)}</dd>
              </div>
              <div>
                <dt className="text-emerald-800/80">Custos estimados</dt>
                <dd className="font-semibold">{formatCurrency(data.analysis.estimatedCosts)}</dd>
              </div>
            </dl>
          </div>
        </CardContent>
      </Card>

      {data.existingInStock ? (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <div>
                <p className="font-medium text-amber-950">Placa já cadastrada no estoque</p>
                <p className="mt-1 text-sm text-amber-900/80">
                  {data.existingInStock.brand} {data.existingInStock.model}
                  {' · '}
                  <Badge variant={vehicleStatusVariant(data.existingInStock.status)} className="ml-1">
                    {vehicleStatusLabels[data.existingInStock.status] ?? data.existingInStock.status}
                  </Badge>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/estoque/consulta-placa?placa=${encodeURIComponent(data.licensePlate)}`}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
              >
                <ScanSearch className="mr-2 h-4 w-4" />
                Ver consulta
              </Link>
              <Link
                href={vehicleEditHref(data.existingInStock.id)}
                className={cn(buttonVariants({ size: 'sm' }))}
              >
                <Car className="mr-2 h-4 w-4" />
                Abrir cadastro
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-emerald-200 bg-emerald-50/40">
          <CardContent className="flex items-center gap-3 p-4 text-sm text-emerald-900">
            <Car className="h-4 w-4 shrink-0" />
            Placa livre no estoque — pode prosseguir com a avaliação de compra.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function PurchaseIntelligencePanel({ initialPlate = '' }: { initialPlate?: string }) {
  const [plateInput, setPlateInput] = useState(initialPlate);
  const [marginPercent, setMarginPercent] = useState('12');
  const [estimatedCosts, setEstimatedCosts] = useState<number | undefined>(2500);
  const [analysis, setAnalysis] = useState<PurchaseIntelligenceAnalysis | null>(null);

  const settingsQuery = useQuery({
    queryKey: ['settings', 'defaults-for-purchase'],
    queryFn: () => api.getTenantSettings(),
  });

  useEffect(() => {
    if (!settingsQuery.data) return;
    const margin = settingsQuery.data.settings.default_margin_percent;
    const costs = settingsQuery.data.settings.estimated_prep_costs_default;
    if (typeof margin === 'number') setMarginPercent(String(margin));
    if (typeof costs === 'number') setEstimatedCosts(costs);
  }, [settingsQuery.data]);

  useEffect(() => {
    if (initialPlate) setPlateInput(normalizePlateInput(initialPlate));
  }, [initialPlate]);

  const historyQuery = useQuery({
    queryKey: ['purchase-intelligence', 'history'],
    queryFn: () => api.getPurchaseIntelligenceHistory({ limit: 8 }),
  });

  const analyze = useMutation({
    mutationFn: () =>
      api.analyzePurchaseIntelligence({
        licensePlate: normalizePlateInput(plateInput),
        desiredMarginPercent: Number(marginPercent),
        estimatedCosts: estimatedCosts ?? 0,
      }),
    onSuccess: (data) => {
      setAnalysis(data);
      historyQuery.refetch();
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Erro na análise');
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const plate = normalizePlateInput(plateInput);
    if (plate.length < 7) {
      toast.error('Informe uma placa válida (7 ou 8 caracteres)');
      return;
    }
    analyze.mutate();
  };

  return (
    <div className="space-y-6">
      <Card className="border border-border shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calculator className="h-4 w-4" />
            Nova análise
          </CardTitle>
          <CardDescription>
            Consulta FIPE por placa e calcula o valor máximo de compra com base na margem e custos
            estimados da revenda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Placa do veículo" required>
              <Input
                className="max-w-xs font-mono uppercase tracking-wider"
                placeholder="ABC1D23"
                value={plateInput}
                maxLength={8}
                onChange={(event) => setPlateInput(normalizePlateInput(event.target.value))}
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2 lg:max-w-2xl">
              <FormField label="Margem desejada (%)">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  value={marginPercent}
                  onChange={(event) => setMarginPercent(event.target.value)}
                />
              </FormField>
              <FormField label="Custos estimados de preparação (R$)">
                <CurrencyInput
                  value={estimatedCosts}
                  onChange={(value) => setEstimatedCosts(value)}
                />
              </FormField>
            </div>

            <Button type="submit" disabled={analyze.isPending}>
              {analyze.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analisando…
                </>
              ) : (
                'Analisar compra'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {analysis ? <AnalysisResults data={analysis} /> : null}

      <Card className="border border-border shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Histórico de consultas
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {historyQuery.isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Carregando histórico…</p>
          ) : (historyQuery.data?.data.length ?? 0) === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Nenhuma consulta registrada ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>FIPE</TableHead>
                  <TableHead>Máx. compra</TableHead>
                  <TableHead>Estoque</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyQuery.data?.data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{formatDate(item.createdAt)}</TableCell>
                    <TableCell className="font-mono">{item.licensePlate}</TableCell>
                    <TableCell>
                      {item.brand && item.model
                        ? `${item.brand} ${item.model}${item.modelYear ? ` (${item.modelYear})` : ''}`
                        : '—'}
                    </TableCell>
                    <TableCell>{formatCurrency(item.fipeValue)}</TableCell>
                    <TableCell>{formatCurrency(item.maxPurchaseValue)}</TableCell>
                    <TableCell>
                      {item.existingVehicleId ? (
                        <Badge variant="warning">Já cadastrado</Badge>
                      ) : (
                        <Badge variant="secondary">Livre</Badge>
                      )}
                    </TableCell>
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
