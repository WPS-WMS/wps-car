'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { PricingIntelligencePanel } from '@/components/pricing-intelligence/pricing-intelligence-panel';
import { hasPermission } from '@/lib/permissions';
import { useAuth } from '@/providers/auth-provider';

function PrecificacaoInteligenteContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialVehicleId = searchParams.get('veiculo') ?? '';

  if (!hasPermission(user, 'pricing-intelligence:read')) {
    return (
      <p className="text-sm text-brand-600">
        Você não tem permissão para acessar a precificação inteligente.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Precificação inteligente"
        description="Sugestão de preço de venda com FIPE, histórico interno, estoque similar e referência de portais"
      />
      <PricingIntelligencePanel
        vehicleId={initialVehicleId || undefined}
        showVehiclePicker
      />
    </div>
  );
}

export default function PrecificacaoInteligentePage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando…</p>}>
      <PrecificacaoInteligenteContent />
    </Suspense>
  );
}
