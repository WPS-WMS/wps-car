import { SelectField } from '@/components/ui/select-field';
import { cn } from '@/lib/utils';

export function SelectFilter({
  value,
  onChange,
  options,
  placeholder,
  ariaLabel,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <SelectField
      className={cn('h-11 sm:w-52', className)}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      aria-label={ariaLabel}
      options={options}
    />
  );
}

