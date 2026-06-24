'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle2,
  Coins,
  History,
  Loader2,
  Pencil,
  Receipt,
  Search,
  ShoppingCart,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import type { PlateLookupResponse } from '@/types/api';
import { vehicleEditHref } from '@/lib/edit-routes';
import { formatCurrency, formatDate, formatPercent } from '@/lib/format';
import { vehiclePhotoListUrl } from '@/lib/vehicle-photo';
import {
  useVehiclePhotoViewer,
  VehiclePhotoThumb,
} from '@/components/vehicles/vehicle-photo-viewer';
import {
  paymentMethodLabels,
  saleStatusLabels,
  saleStatusVariant,
  stockMovementTypeLabels,
  vehicleCostTypeLabels,
  vehicleStatusLabels,
  vehicleStatusVariant,
  vehicleTypeLabels,
} from '@/lib/labels';
import { hasPermission } from '@/lib/permissions';
import { useAuth } from '@/providers/auth-provider';
import { PageHeader } from '@/components/layout/page-header';
import { BackLink } from '@/components/layout/back-link';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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

function FinancialResultSection({
  result,
}: {
  result: NonNullable<Extract<PlateLookupResponse, { found: true }>['financialResult']>;
}) {
  const items = [
    { label: 'Valor de compra', value: formatCurrency(result.purchaseValue) },
    { label: 'Total de custos', value: formatCurrency(result.totalCosts) },
    { label: 'Valor de venda', value: formatCurrency(result.saleValue) },
    { label: 'Lucro bruto', value: formatCurrency(result.grossProfit) },
    { label: 'Comissão', value: formatCurrency(result.commissionValue) },
    { label: 'Resultado líquido', value: formatCurrency(result.netResult) },
    { label: 'Margem %', value: formatPercent(result.marginPercent) },
    { label: 'Dias em estoque', value: result.daysInStock ?? '—' },
  ];

  return (
    <Card className="border-brand-200/80 bg-brand-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Coins className="h-4 w-4" />
          Resultado financeiro
        </CardTitle>
        <CardDescription>
          Calculado com base em compra, venda, custos e comissão
          {result.calculatedAt ? ` · atualizado em ${formatDate(result.calculatedAt)}` : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <div key={item.label} className="rounded-lg border border-brand-100 bg-white px-4 py-3">
              <dt className="text-xs font-medium text-muted-foreground">{item.label}</dt>
              <dd className="mt-1 text-base font-semibold text-brand-900">{item.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

function LookupResults({ data }: { data: Extract<PlateLookupResponse, { found: true }> }) {
  const { user } = useAuth();
  const canUpdate = hasPermission(user, 'vehicles:update');
  const { vehicle, purchase, sales, costs, stockMovements } = data;
  const photo = vehicle.primaryPhoto;

  const viewerPhotos =
    vehicle.photos?.map(({ id, url, fileName, isPrimary }) => ({
      id,
      url,
      fileName,
      isPrimary,
    })) ?? [];

  const viewer = useVehiclePhotoViewer({
    vehicleId: vehicle.id,
    photos: viewerPhotos.length ? viewerPhotos : undefined,
    fallbackPhoto: photo
      ? {
          id: photo.id,
          url: photo.url,
          fileName: photo.fileName,
          isPrimary: photo.isPrimary,
        }
      : null,
  });

  const primaryIndex = Math.max(
    0,
    viewer.photos.findIndex((item) => item.isPrimary),
  );

  return (
    <div className="space-y-6">
      <Card className="border border-border shadow-card">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start">
          <VehiclePhotoThumb
            path={vehiclePhotoListUrl(photo)}
            alt={`${vehicle.brand} ${vehicle.model}`}
            size="lg"
            isPrimary={photo?.isPrimary}
            onClick={photo?.url ? () => viewer.openAt(primaryIndex) : undefined}
          />

          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold text-foreground">
                    {vehicle.brand} {vehicle.model}
                  </h2>
                  <Badge variant={vehicleStatusVariant(vehicle.status)}>
                    {vehicleStatusLabels[vehicle.status] ?? vehicle.status}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Placa <span className="font-mono font-medium text-foreground">{data.plate}</span>
                  {' · '}
                  {vehicleTypeLabels[vehicle.type] ?? vehicle.type}
                  {' · '}
                  {vehicle.modelYear}
                  {vehicle.branchName ? ` · ${vehicle.branchName}` : ''}
                </p>
              </div>
              {canUpdate ? (
                <Link
                  href={vehicleEditHref(vehicle.id)}
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Abrir cadastro
                </Link>
              ) : null}
            </div>

            <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-muted-foreground">Cor</dt>
                <dd className="font-medium">{vehicle.color ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Quilometragem</dt>
                <dd className="font-medium">
                  {vehicle.mileage != null ? `${vehicle.mileage.toLocaleString('pt-BR')} km` : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Chassi</dt>
                <dd className="font-medium font-mono text-xs">{vehicle.chassis ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Renavam</dt>
                <dd className="font-medium">{vehicle.renavam ?? '—'}</dd>
              </div>
            </dl>
          </div>
        </CardContent>
      </Card>

      {purchase ? (
        <Card className="border border-border shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="h-4 w-4" />
              Histórico de compra
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-xs text-muted-foreground">Valor de compra</dt>
                <dd className="text-base font-semibold">{formatCurrency(purchase.purchaseValue)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Data da compra</dt>
                <dd className="text-base font-semibold">{formatDate(purchase.purchaseDate)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Fornecedor</dt>
                <dd className="text-base font-semibold">{purchase.supplier?.name ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Valor FIPE</dt>
                <dd className="text-base font-semibold">{formatCurrency(purchase.fipeValue)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Sugestão de compra</dt>
                <dd className="text-base font-semibold">
                  {formatCurrency(purchase.suggestedPurchaseValue)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Valor anunciado</dt>
                <dd className="text-base font-semibold">{formatCurrency(purchase.listedValue)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border border-border shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Histórico de venda
          </CardTitle>
          <CardDescription>
            {sales.length === 0
              ? 'Nenhuma venda registrada para este veículo.'
              : `${sales.length} registro(s) encontrado(s).`}
          </CardDescription>
        </CardHeader>
        {sales.length > 0 ? (
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Comissão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{formatDate(sale.saleDate)}</TableCell>
                    <TableCell>{sale.customer?.name ?? '—'}</TableCell>
                    <TableCell>{sale.seller?.name ?? '—'}</TableCell>
                    <TableCell>{formatCurrency(sale.amount)}</TableCell>
                    <TableCell>
                      {paymentMethodLabels[sale.paymentMethod] ?? sale.paymentMethod}
                    </TableCell>
                    <TableCell>
                      <Badge variant={saleStatusVariant(sale.status)}>
                        {saleStatusLabels[sale.status] ?? sale.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(sale.commission)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        ) : null}
      </Card>

      <Card className="border border-border shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="h-4 w-4" />
            Custos vinculados
          </CardTitle>
          <CardDescription>
            {costs.length === 0
              ? 'Nenhum custo lançado para este veículo.'
              : `${costs.length} custo(s) registrado(s).`}
          </CardDescription>
        </CardHeader>
        {costs.length > 0 ? (
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costs.map((cost) => (
                  <TableRow key={cost.id}>
                    <TableCell>{formatDate(cost.costDate)}</TableCell>
                    <TableCell>
                      {vehicleCostTypeLabels[cost.type] ?? cost.type}
                    </TableCell>
                    <TableCell>{cost.description}</TableCell>
                    <TableCell>{cost.supplier?.name ?? '—'}</TableCell>
                    <TableCell className="text-right">{formatCurrency(cost.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        ) : null}
      </Card>

      {data.financialResult ? <FinancialResultSection result={data.financialResult} /> : null}

      {stockMovements.length > 0 ? (
        <Card className="border border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Movimentações de estoque</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Referência</TableHead>
                  <TableHead>Usuário</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockMovements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>{formatDate(movement.createdAt)}</TableCell>
                    <TableCell>
                      {stockMovementTypeLabels[movement.type] ?? movement.type}
                    </TableCell>
                    <TableCell>{movement.description ?? '—'}</TableCell>
                    <TableCell>{movement.reference ?? '—'}</TableCell>
                    <TableCell>{movement.user?.name ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
      {viewer.lightbox}
    </div>
  );
}

export function PlateLookupPanel({
  initialPlate = '',
}: {
  initialPlate?: string;
}) {
  const [plateInput, setPlateInput] = useState(initialPlate);
  const [result, setResult] = useState<PlateLookupResponse | null>(null);

  useEffect(() => {
    if (initialPlate) setPlateInput(normalizePlateInput(initialPlate));
  }, [initialPlate]);

  const lookup = useMutation({
    mutationFn: (plate: string) => api.lookupStockByPlate(plate),
    onSuccess: (data) => {
      setResult(data);
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : 'Não foi possível consultar a placa';
      toast.error(message);
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const plate = normalizePlateInput(plateInput);
    if (plate.length < 7) {
      toast.error('Informe uma placa válida (7 ou 8 caracteres)');
      return;
    }
    lookup.mutate(plate);
  };

  return (
    <div className="space-y-6">
      <Card className="border border-border shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Consultar placa</CardTitle>
          <CardDescription>
            Digite a placa para verificar se o veículo já está cadastrado no estoque da revenda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-500" />
              <Input
                className="pl-9 font-mono uppercase tracking-wider"
                placeholder="ABC1D23"
                value={plateInput}
                maxLength={8}
                onChange={(event) => setPlateInput(normalizePlateInput(event.target.value))}
              />
            </div>
            <Button type="submit" disabled={lookup.isPending}>
              {lookup.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Consultando…
                </>
              ) : (
                'Consultar'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && !result.found ? (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="flex items-start gap-3 p-6">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <p className="font-medium text-amber-950">Veículo não encontrado</p>
              <p className="mt-1 text-sm text-amber-900/80">
                Não há veículo com a placa{' '}
                <span className="font-mono font-semibold">{result.plate}</span> cadastrado nesta
                revenda.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {result?.found ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-emerald-800">
            <CheckCircle2 className="h-4 w-4" />
            Veículo encontrado no estoque da revenda
          </div>
          <LookupResults data={result} />
        </div>
      ) : null}
    </div>
  );
}

export function PlateLookupPage({
  initialPlate = '',
  headerAction,
}: {
  initialPlate?: string;
  headerAction?: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <BackLink href="/estoque" label="Voltar para estoque" />
      <PageHeader
        title="Consulta por placa"
        description="Localize rapidamente um veículo pelo número da placa e veja status, histórico e resultado financeiro"
      >
        {headerAction}
      </PageHeader>
      <PlateLookupPanel initialPlate={initialPlate} />
    </div>
  );
}
