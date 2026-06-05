'use client';

import * as React from 'react';
import { formatCpfCnpj } from '@/lib/br-input-masks';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function DocumentInput({
  value,
  onChange,
  personType,
  className,
  ...props
}: Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange' | 'type'> & {
  value: string;
  onChange: (value: string) => void;
  personType: 'INDIVIDUAL' | 'COMPANY';
}) {
  return (
    <Input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder={personType === 'COMPANY' ? '00.000.000/0000-00' : '000.000.000-00'}
      className={cn(className)}
      value={value}
      onChange={(e) => onChange(formatCpfCnpj(e.target.value, personType))}
      {...props}
    />
  );
}
