'use client';

import { SelectField } from '@/components/ui/select-field';
import { useTenantBranchOptions } from '@/hooks/use-tenant-branch-options';

export function BranchFilterField({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (branchId: string) => void;
  className?: string;
}) {
  const { options, isLoading } = useTenantBranchOptions(true, null);

  return (
    <SelectField
      className={className ?? 'sm:w-52'}
      value={value}
      onChange={onChange}
      placeholder="Todas as filiais"
      aria-label="Filtrar por filial"
      disabled={isLoading}
      options={[
        { value: 'all', label: 'Todas as filiais' },
        { value: 'matriz', label: 'Matriz' },
        ...options.filter((o) => o.value !== ''),
      ]}
    />
  );
}
