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
import { SupplierForm } from '@/components/cadastro/supplier-form';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function EditarFornecedorContent() {
  const id = useSearchParams().get('id') ?? '';
  const { user } = useAuth();
  const canRead = hasPermission(user, 'suppliers:read');
  const canUpdate = hasPermission(user, 'suppliers:update');

  const query = useQuery({
    queryKey: ['suppliers', id],
    queryFn: () => api.getSupplier(id),
    enabled: !!id && canRead,
  });

  if (!id) {
    return <p className="text-sm text-destructive">ID do fornecedor não informado.</p>;
  }

  if (!canRead) {
    return <p className="text-sm text-brand-600">Sem permissão para visualizar fornecedores.</p>;
  }

  if (query.isLoading) {
    return <p className="text-sm text-brand-600">Carregando fornecedor…</p>;
  }

  if (query.isError || !query.data) {
    return <p className="text-sm text-destructive">Fornecedor não encontrado.</p>;
  }

  const s = query.data;

  return (
    <div className="space-y-6">
      <PageHeader title="Editar fornecedor" description={s.name}>
        <Link href="/fornecedores" className={cn(buttonVariants({ variant: 'outline' }))}>
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Link>
      </PageHeader>
      <SupplierForm mode="edit" supplierId={id} initialData={s} canUpdate={canUpdate} />
    </div>
  );
}

export default function EditarFornecedorPage() {
  return (
    <Suspense fallback={<p className="text-sm text-brand-600">Carregando…</p>}>
      <EditarFornecedorContent />
    </Suspense>
  );
}
