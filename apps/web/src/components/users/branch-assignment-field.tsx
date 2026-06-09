'use client';

import { FormNativeSelect } from '@/components/vehicles/form-field';
import { useTenantBranchOptions } from '@/hooks/use-tenant-branch-options';

import { BRANCH_ASSIGNMENT_HINT } from '@/lib/user-branch-rules';

export function BranchAssignmentField({
  label = 'Loja / filial',
  required = true,
  value,
  onChange,
  error,
  currentBranch = null,
}: {
  label?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  currentBranch?: { id: string; name: string } | null;
}) {
  const { options, isLoading } = useTenantBranchOptions(true, currentBranch);

  return (
    <div className="space-y-1">
      <FormNativeSelect
        label={label}
        required={required}
        value={value}
        onChange={onChange}
        options={
          isLoading
            ? [{ value: '', label: 'Carregando filiais…' }]
            : options
        }
        error={error}
        disabled={isLoading}
      />
      <p className="text-xs text-muted-foreground">{BRANCH_ASSIGNMENT_HINT}</p>
    </div>
  );
}
