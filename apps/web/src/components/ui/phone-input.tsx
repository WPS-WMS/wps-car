'use client';

import * as React from 'react';
import { formatPhone } from '@/lib/br-input-masks';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function PhoneInput({
  value,
  onChange,
  className,
  ...props
}: Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange' | 'type'> & {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Input
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      placeholder="(00) 00000-0000"
      className={cn(className)}
      value={value}
      onChange={(e) => onChange(formatPhone(e.target.value))}
      {...props}
    />
  );
}
