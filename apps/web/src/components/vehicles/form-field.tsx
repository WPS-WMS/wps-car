import * as React from 'react';
import { Label } from '@/components/ui/label';
import { SelectField } from '@/components/ui/select-field';
import { cn } from '@/lib/utils';
import { selectClass } from '@/lib/styles';

export function FormField({
  label,
  required,
  error,
  children,
  className,
  fieldId,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
  fieldId?: string;
}) {
  const errorId = fieldId && error ? `${fieldId}-error` : undefined;

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={fieldId}>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {(() => {
        if (!error || !errorId || !fieldId) return children;
        if (!React.isValidElement(children)) return children;

        const prev: any = children.props ?? {};
        const nextDescribedBy = prev['aria-describedby']
          ? `${prev['aria-describedby']} ${errorId}`
          : errorId;

        return React.cloneElement(children, {
          'aria-invalid': true,
          'aria-describedby': nextDescribedBy,
          id: prev.id ?? fieldId,
        } as any);
      })()}
      {error ? (
        <p id={errorId} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function FormSelect({
  label,
  required,
  error,
  value,
  onChange,
  options,
  placeholder = 'Selecione…',
  disabled,
  id,
}: {
  label: string;
  required?: boolean;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-');

  return (
    <FormField label={label} required={required} error={error} fieldId={fieldId}>
      <SelectField
        id={fieldId}
        value={value}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        error={error}
        includeEmptyOption
        aria-label={label}
      />
    </FormField>
  );
}

export function FormNativeSelect({
  label,
  required,
  error,
  value,
  onChange,
  options,
  placeholder,
  disabled,
  id,
}: {
  label: string;
  required?: boolean;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-');

  return (
    <FormField label={label} required={required} error={error} fieldId={fieldId}>
      <select
        id={fieldId}
        className={selectClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        aria-invalid={error ? true : undefined}
      >
        {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}

export function FormTextarea({
  label,
  required,
  error,
  ...props
}: {
  label: string;
  required?: boolean;
  error?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <FormField label={label} required={required} error={error}>
      <textarea
        className={cn(selectClass, 'min-h-[100px] resize-y py-2')}
        aria-invalid={error ? true : undefined}
        {...props}
      />
    </FormField>
  );
}
