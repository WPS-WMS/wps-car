'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { useTenantBranchOptions } from '@/hooks/use-tenant-branch-options';
import { SelectField } from '@/components/ui/select-field';

export type AnalyticsScopeValue = {
  branchId: string;
  sellerId: string;
};

export const emptyAnalyticsScope = (): AnalyticsScopeValue => ({
  branchId: 'all',
  sellerId: '',
});

export function AnalyticsScopeFilter({
  value,
  onChange,
  showBranch = true,
  showSeller = true,
  className,
}: {
  value: AnalyticsScopeValue;
  onChange: (next: AnalyticsScopeValue) => void;
  showBranch?: boolean;
  showSeller?: boolean;
  className?: string;
}) {
  const { user, isManager } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const { options: branchOptions, isLoading: branchesLoading } = useTenantBranchOptions(
    true,
    null,
  );

  const sellersQuery = useQuery({
    queryKey: ['users', 'analytics-sellers', user?.tenantId, value.branchId],
    queryFn: () =>
      api.getUsers({
        page: 1,
        limit: 100,
        role: 'SELLER',
      }),
    enabled: showSeller && isManager && !!user?.tenantId,
  });

  const sellerOptions = useMemo(() => {
    const rows = sellersQuery.data?.data ?? [];
    const branchFilter =
      isAdmin && value.branchId && value.branchId !== 'all'
        ? value.branchId === 'matriz'
          ? null
          : value.branchId
        : isAdmin
          ? undefined
          : user?.branchId ?? null;

    const filtered =
      branchFilter === undefined
        ? rows
        : rows.filter((u) => (u.branchId ?? null) === branchFilter);

    return [
      { value: '', label: 'Todos os vendedores' },
      ...filtered.map((u) => ({ value: u.id, label: u.name })),
    ];
  }, [isAdmin, sellersQuery.data?.data, user?.branchId, value.branchId]);

  const branchSelectOptions = useMemo(
    () => [
      { value: 'all', label: 'Todas as filiais' },
      { value: 'matriz', label: 'Matriz' },
      ...branchOptions.filter((o) => o.value !== ''),
    ],
    [branchOptions],
  );

  if (!isManager) return null;

  return (
    <div className={className ?? 'flex flex-col gap-3 sm:flex-row sm:items-end'}>
      {showBranch && isAdmin ? (
        <SelectField
          aria-label="Filial"
          value={value.branchId}
          onChange={(branchId) => onChange({ ...value, branchId, sellerId: '' })}
          options={branchesLoading ? [{ value: 'all', label: 'Carregando…' }] : branchSelectOptions}
          className="min-w-[180px]"
        />
      ) : null}

      {showSeller ? (
        <SelectField
          aria-label="Vendedor"
          value={value.sellerId}
          onChange={(sellerId) => onChange({ ...value, sellerId })}
          options={
            sellersQuery.isLoading
              ? [{ value: '', label: 'Carregando…' }]
              : sellerOptions
          }
          className="min-w-[180px]"
        />
      ) : null}
    </div>
  );
}

export function analyticsScopeParams(scope: AnalyticsScopeValue, isAdmin: boolean) {
  const params: Record<string, string | undefined> = {};
  if (isAdmin && scope.branchId && scope.branchId !== 'all') {
    params.branchId = scope.branchId;
  }
  if (scope.sellerId) {
    params.sellerId = scope.sellerId;
  }
  return params;
}

export function scopeQueryKey(scope: AnalyticsScopeValue) {
  return { branchId: scope.branchId, sellerId: scope.sellerId || null };
}
