'use client';

import * as React from 'react';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/format';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function CurrencyInput({
  value,
  onChange,
  className,
  ...props
}: Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange' | 'type'> & {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}) {
  const [display, setDisplay] = React.useState(() => formatCurrencyInput(value));

  React.useEffect(() => {
    setDisplay(formatCurrencyInput(value));
  }, [value]);

  return (
    <Input
      type="text"
      inputMode="decimal"
      autoComplete="off"
      placeholder="0,00"
      className={cn(className)}
      value={display}
      onChange={(e) => {
        const nextDisplay = e.target.value;
        const parsed = parseCurrencyInput(nextDisplay);
        setDisplay(
          parsed === undefined ? nextDisplay.replace(/[^\d]/g, '') : formatCurrencyInput(parsed),
        );
        onChange(parsed);
      }}
      onBlur={() => {
        setDisplay(formatCurrencyInput(value));
      }}
      onFocus={(e) => e.target.select()}
      {...props}
    />
  );
}
