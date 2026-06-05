'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { hasPermission } from '@/lib/permissions';
import { PageHeader } from '@/components/layout/page-header';
import { VehicleForm } from '@/components/vehicles/vehicle-form';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function NovoVeiculoPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const canCreate = hasPermission(user, 'vehicles:create');

  useEffect(() => {
    if (!isLoading && !canCreate) {
      router.replace('/veiculos');
    }
  }, [isLoading, canCreate, router]);

  if (isLoading || !canCreate) {
    return <p className="text-sm text-brand-600">Carregando…</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo veículo ou produto"
        description="Cadastre carros, motos, caminhões, utilitários ou produtos (peças, acessórios e outros bens)"
      >
        <Link
          href="/veiculos"
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Link>
      </PageHeader>
      <VehicleForm mode="create" />
    </div>
  );
}
