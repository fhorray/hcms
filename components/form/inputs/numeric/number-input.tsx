'use client';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { FieldError } from '../error';
import { LabelArea } from '../label';
import { FieldWrapper } from '../wrapper';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useFieldContext } from '@/components/form/form-context';

interface InputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'type' | 'value' | 'defaultValue' | 'onChange'
  > {
  label?: string;
  id: string;
  description?: string;
  showMinMax?: boolean;
  /** valor inicial, se o form ainda não tiver valor */
  defaultValue?: number;
}

function toNum(v: unknown, fallback: number): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n: number, min: number, max: number) {
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

const NumberField = ({
  label,
  id,
  description,
  min = 0,
  max = 100,
  step = 1,
  showMinMax = true,
  defaultValue,
  ...props
}: InputProps) => {
  // O campo É number:
  const field = useFieldContext<number>();

  // Coerções numéricas locais (min/max/step podem vir como string pelo HTML)
  const minN = useMemo(() => toNum(min, 0), [min]);
  const maxN = useMemo(() => toNum(max, 100), [max]);
  const stepN = useMemo(() => Math.max(toNum(step, 1), 0.000001), [step]); // evita step 0

  // Estado visual controlado por número
  const [value, setValue] = useState<number>(() => {
    // 1) prioriza valor do form
    if (
      typeof field.state.value === 'number' &&
      Number.isFinite(field.state.value)
    ) {
      return clamp(field.state.value, minN, maxN);
    }
    // 2) senão usa defaultValue
    const initial = toNum(defaultValue, minN);
    return clamp(initial, minN, maxN);
  });

  // Se o valor do form mudar externamente, sincroniza o input
  useEffect(() => {
    const v = field.state.value;
    if (typeof v === 'number' && Number.isFinite(v)) {
      setValue(clamp(v, minN, maxN));
    }
  }, [field.state.value, minN, maxN]);

  // Garante que o form tenha um número inicial se ainda não tiver
  useEffect(() => {
    if (
      !(
        typeof field.state.value === 'number' &&
        Number.isFinite(field.state.value)
      )
    ) {
      field.setValue(value); // number garantido
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // apenas na montagem

  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // valueAsNumber já entrega number (ou NaN) para <input type="number">
    const raw = e.currentTarget.valueAsNumber;
    if (Number.isNaN(raw)) {
      // Não alteramos o form enquanto o valor não é numérico;
      // mantemos o último number válido no input.
      return;
    }
    const next = clamp(raw, minN, maxN);
    setValue(next);
    field.setValue(next); // ← sempre number
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // clamp final ao sair do campo, caso o usuário tenha digitado fora dos limites
    const n = e.currentTarget.valueAsNumber;
    if (!Number.isNaN(n)) {
      const next = clamp(n, minN, maxN);
      setValue(next);
      field.setValue(next);
    } else {
      // se ficar NaN (campo apagado), volta pro último válido
      field.setValue(value);
    }
    setIsFocused(false);
  };

  const incrementValue = () => {
    const next = clamp(value + stepN, minN, maxN);
    setValue(next);
    field.setValue(next); // ← sempre number
  };

  const decrementValue = () => {
    const next = clamp(value - stepN, minN, maxN);
    setValue(next);
    field.setValue(next); // ← sempre number
  };

  const percentage = useMemo(() => {
    const range = maxN - minN;
    if (range <= 0) return 0; // evita divisão por 0
    return ((value - minN) / range) * 100;
  }, [value, minN, maxN]);

  return (
    <FieldWrapper>
      {label && (
        <LabelArea label={label} htmlFor={id} required={props.required} />
      )}

      <div
        className={cn(
          'w-full flex items-center rounded-lg border',
          'border-zinc-200 dark:border-zinc-800',
          'bg-white dark:bg-black/5',
          isFocused && 'ring-2 ring-zinc-300 dark:ring-zinc-700',
        )}
      >
        <Button
          type="button"
          onClick={decrementValue}
          className="rounded-r-none"
          aria-label="Decrement button"
        >
          -
        </Button>

        <Input
          id={id}
          type="number"
          value={Number.isFinite(value) ? value : ''} // sempre controlado por number
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          min={minN}
          max={maxN}
          step={stepN}
          inputMode="decimal"
          style={{
            appearance: 'textfield',
            MozAppearance: 'textfield',
            WebkitAppearance: 'none',
          }}
          className={cn(
            'w-full rounded-none px-2 focus-visible:outline-none',
            props.className,
          )}
          {...props}
        />

        <Button
          type="button"
          onClick={incrementValue}
          className="rounded-l-none"
          aria-label="Increment button"
        >
          +
        </Button>
      </div>

      {showMinMax && (
        <>
          <div className="mt-2 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-zinc-300 dark:bg-zinc-600 transition-all duration-200"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-xs text-zinc-400 dark:text-zinc-500">
            <span>{minN}</span>
            <span>{maxN}</span>
          </div>
        </>
      )}

      {description && <span className="text-sm opacity-45">{description}</span>}
      <FieldError />
    </FieldWrapper>
  );
};

export default NumberField;
