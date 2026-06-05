'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { hasPermission } from '@/lib/permissions';
import { PageHeader } from '@/components/layout/page-header';
import { SupplierForm } from '@/components/cadastro/supplier-form';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function NovoFornecedorPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const canCreate = hasPermission(user, 'suppliers:create');
  const canUpdate = hasPermission(user, 'suppliers:update');

  useEffect(() => {
    if (!isLoading && !canCreate) router.replace('/fornecedores');
  }, [isLoading, canCreate, router]);

  if (isLoading || !canCreate) {
    return <p className="text-sm text-brand-600">Carregando…</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Novo fornecedor" description="Cadastro de fornecedor ou parceiro">
        <Link href="/fornecedores" className={cn(buttonVariants({ variant: 'outline' }))}>
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Link>
      </PageHeader>
      <SupplierForm mode="create" canUpdate={canUpdate} />
    </div>
  );
}
