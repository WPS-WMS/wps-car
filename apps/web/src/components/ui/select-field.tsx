'use client';

import type { ReactNode } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export type SelectOption = { value: string; label: string };

const EMPTY_KEY = '__select_empty__';

function toSelectValue(value: string) {
  return value === '' ? null : value;
}

function fromSelectValue(value: string | null) {
  return value ?? '';
}

export function SelectField({
  value,
  onChange,
  options,
  placeholder = 'Selecione…',
  disabled,
  required,
  error,
  id,
  name,
  className,
  contentClassName,
  size = 'default',
  includeEmptyOption = false,
  'aria-label': ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: boolean | string;
  id?: string;
  name?: string;
  className?: string;
  contentClassName?: string;
  size?: 'sm' | 'default';
  /** Adiciona opção vazia no início (comportamento do FormSelect legado). */
  includeEmptyOption?: boolean;
  'aria-label'?: string;
}) {
  const invalid = Boolean(error);
  const optionList: SelectOption[] = includeEmptyOption
    ? [{ value: '', label: placeholder }, ...options.filter((o) => o.value !== '')]
    : options;

  /** Base UI exibe o value bruto no trigger sem `items` (ex.: CAR em vez de Carro). */
  const selectItems = Object.fromEntries(
    optionList
      .filter((o) => o.value !== '')
      .map((o) => [o.value, o.label]),
  ) as Record<string, ReactNode>;

  return (
    <Select
      modal={false}
      name={name}
      items={selectItems}
      value={toSelectValue(value)}
      onValueChange={(next) => onChange(fromSelectValue(next as string | null))}
      disabled={disabled}
      required={required}
    >
      <SelectTrigger
        id={id}
        size={size}
        aria-label={ariaLabel ?? (id ? undefined : placeholder)}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid && id ? `${id}-error` : undefined}
        className={cn(className)}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={cn(contentClassName)} sideOffset={6}>
        {optionList.map((option) => {
          const itemValue = option.value === '' ? null : option.value;
          const key = option.value === '' ? EMPTY_KEY : option.value;
          return (
            <SelectItem key={key} value={itemValue}>
              {option.label}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
