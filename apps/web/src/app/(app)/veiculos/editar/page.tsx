'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { hasPermission } from '@/lib/permissions';
import { PageHeader } from '@/components/layout/page-header';
import { VehicleEditTabs } from '@/components/vehicles/vehicle-edit-tabs';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function EditarVeiculoContent() {
  const id = useSearchParams().get('id') ?? '';
  const { user } = useAuth();
  const canUpdate = hasPermission(user, 'vehicles:update');

  const query = useQuery({
    queryKey: ['vehicles', id],
    queryFn: () => api.getVehicle(id),
    enabled: !!id && canUpdate,
  });

  if (!id) {
    return <p className="text-sm text-destructive">ID do veículo não informado.</p>;
  }

  if (!canUpdate) {
    return (
      <p className="text-sm text-brand-600">
        Você não tem permissão para editar veículos.
      </p>
    );
  }

  if (query.isLoading) {
    return <p className="text-sm text-brand-600">Carregando veículo…</p>;
  }

  if (query.isError || !query.data) {
    return (
      <p className="text-sm text-destructive">
        Veículo não encontrado ou erro ao carregar.
      </p>
    );
  }

  const v = query.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Editar cadastro"
        description={`${v.brand} ${v.model}${v.licensePlate ? ` · ${v.licensePlate}` : ''}`}
      >
        <Link href="/veiculos" className={cn(buttonVariants({ variant: 'outline' }))}>
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Link>
      </PageHeader>
      <VehicleEditTabs vehicleId={id} initialData={v} />
    </div>
  );
}

export default function EditarVeiculoPage() {
  return (
    <Suspense fallback={<p className="text-sm text-brand-600">Carregando…</p>}>
      <EditarVeiculoContent />
    </Suspense>
  );
}
