'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';

export function useTenantBranchOptions(
  activeOnly = true,
  currentBranch?: { id: string; name: string } | null,
) {
  const { user } = useAuth();
  const tenantId = user?.tenantId ?? null;

  const query = useQuery({
    queryKey: ['tenant-branches', tenantId, { activeOnly }],
    queryFn: () => api.getTenantBranches(activeOnly),
    enabled: !!tenantId,
  });

  const options = useMemo(() => {
    const branchOptions = (query.data ?? []).map((branch) => ({
      value: branch.id,
      label: branch.name,
    }));

    if (
      currentBranch?.id &&
      !branchOptions.some((option) => option.value === currentBranch.id)
    ) {
      branchOptions.push({
        value: currentBranch.id,
        label: `${currentBranch.name} (inativa)`,
      });
    }

    return [{ value: '', label: 'Matriz' }, ...branchOptions];
  }, [currentBranch, query.data]);

  return {
    options,
    branches: query.data ?? [],
    isLoading: query.isLoading,
  };
}

export function branchIdToPayload(branchId: string): string | null {
  return branchId.trim() ? branchId : null;
}

export function userBranchLabel(user: {
  branchId?: string | null;
  branchName?: string | null;
}) {
  return user.branchName ?? 'Matriz';
}
