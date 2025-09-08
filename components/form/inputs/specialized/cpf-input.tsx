'use client';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { FieldError } from '../error';
import { LabelArea } from '../label';
import { FieldWrapper } from '../wrapper';

import { useCallback } from 'react';
import { useFieldContext } from '@/components/form/form-context';

interface CPFInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  id: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  description?: string;
}

function formatCpf(value: string) {
  return value
    .replace(/\D/g, '') // só números
    .replace(/(\d{3})(\d)/, '$1.$2') // 000.
    .replace(/(\d{3})(\d)/, '$1.$2') // 000.000.
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2') // 000.000.000-00
    .slice(0, 14); // limita ao tamanho máximo
}

const CPFField = ({
  label,
  icon,
  id,
  description,
  ...props
}: CPFInputProps) => {
  const field = useFieldContext<string>();
  const Icon = icon;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatCpf(e.target.value);
      field.setValue(formatted);
    },
    [field],
  );

  return (
    <FieldWrapper>
      {label && (
        <LabelArea label={label} htmlFor={id} required={props.required} />
      )}

      <div className="relative w-full">
        {Icon && (
          <span className="absolute top-2.5 left-2 max-w-4 max-h-4 object-cover">
            <Icon className="w-4 h-4 opacity-45" />
          </span>
        )}

        <Input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={field.state.value ?? ''}
          onChange={handleChange}
          maxLength={14} // 000.000.000-00
          className={cn(icon && 'pl-7 pb-1.5', props.className)}
          {...props}
        />
      </div>

      {description && <span className="text-sm opacity-45">{description}</span>}
      <FieldError />
    </FieldWrapper>
  );
};

export default CPFField;
