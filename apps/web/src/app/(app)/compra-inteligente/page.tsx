'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { PurchaseIntelligencePanel } from '@/components/purchase-intelligence/purchase-intelligence-panel';
import { hasPermission } from '@/lib/permissions';
import { useAuth } from '@/providers/auth-provider';

function CompraInteligenteContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialPlate = searchParams.get('placa') ?? '';

  if (!hasPermission(user, 'purchase-intelligence:read')) {
    return (
      <p className="text-sm text-brand-600">
        Você não tem permissão para acessar a compra inteligente.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compra inteligente"
        description="Consulte FIPE pela placa, calcule o valor máximo de compra e veja se o veículo já está no estoque"
      />
      <PurchaseIntelligencePanel initialPlate={initialPlate} />
    </div>
  );
}

export default function CompraInteligentePage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando…</p>}>
      <CompraInteligenteContent />
    </Suspense>
  );
}
