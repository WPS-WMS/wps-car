'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { PlateLookupPage } from '@/components/stock/plate-lookup-panel';
import { hasPermission } from '@/lib/permissions';
import { useAuth } from '@/providers/auth-provider';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function ConsultaPlacaContent() {
  const searchParams = useSearchParams();
  const initialPlate = searchParams.get('placa') ?? '';
  const { user } = useAuth();
  const canAnalyze = hasPermission(user, 'purchase-intelligence:read');

  return (
    <PlateLookupPage
      initialPlate={initialPlate}
      headerAction={
        canAnalyze ? (
          <Link
            href={`/compra-inteligente${initialPlate ? `?placa=${encodeURIComponent(initialPlate)}` : ''}`}
            className={cn(buttonVariants({ variant: 'outline' }))}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Compra inteligente
          </Link>
        ) : null
      }
    />
  );
}

export default function ConsultaPlacaPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando…</p>}>
      <ConsultaPlacaContent />
    </Suspense>
  );
}
