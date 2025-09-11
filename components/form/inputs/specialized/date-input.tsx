'use client';

import * as React from 'react';
import {
  Calendar as CalendarIcon,
  X as ClearIcon,
  LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { FieldError } from '../error';
import { LabelArea } from '../label';
import { FieldWrapper } from '../wrapper';
import { useFieldContext } from '@/components/form/form-context';

import { format, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import dayjs from 'dayjs';

type IconType = LucideIcon;

interface DatePickerFieldProps {
  id: string;
  label?: string;
  description?: string;
  className?: string;
  icon?: IconType; // ícone à esquerda (como no InputField)
  /** Formato para exibição no input (ex.: dd/MM/yyyy) */
  displayFormat?: string;
  /** Data mínima/máxima permitida */
  minDate?: Date;
  maxDate?: Date;
  /** Desabilita datas adicionais (segue API do shadcn Calendar) */
  disabled?: (date: Date) => boolean;
  /** Se obrigatório, o Label mostra * */
  required?: boolean;
}

/**
 * DatePickerField
 * - Armazena no form: number (epoch em milissegundos, 00:00:00 local)
 * - Exibe no input: 'dd/MM/yyyy' (padrão pt-BR)
 */
const DatePickerField: React.FC<DatePickerFieldProps> = ({
  id,
  label,
  description,
  className,
  icon: Icon = CalendarIcon,
  displayFormat = 'dd/MM/yyyy',
  minDate,
  maxDate,
  disabled,
  required,
}) => {
  // GUARDA: number | null  → number (ms) quando setado, null quando vazio
  const field = useFieldContext<number | null>();
  const [open, setOpen] = React.useState(false);

  // Coerções robustas (aceita ms, s, ISO)
  const coerceToDate = React.useCallback((v: unknown): Date | undefined => {
    if (v == null) return undefined;

    // number → s ou ms
    if (typeof v === 'number' && Number.isFinite(v)) {
      const ms = v < 1e12 ? v * 1000 : v; // < 1e12 → segundos
      const d = new Date(ms);
      return isValid(d) ? d : undefined;
    }

    // string → ISO ou numérica
    if (typeof v === 'string' && v.trim()) {
      // numérica como string (s/ms)
      if (/^\d+$/.test(v)) {
        const n = Number(v);
        const ms = n < 1e12 ? n * 1000 : n;
        const d = new Date(ms);
        return isValid(d) ? d : undefined;
      }
      // ISO
      const d = parseISO(v.length > 10 ? v : `${v}T00:00:00`);
      return isValid(d) ? d : undefined;
    }

    return undefined;
  }, []);

  // Date selecionada (para o Calendar)
  const selectedDate: Date | undefined = React.useMemo(
    () => coerceToDate(field.state.value),
    [field.state.value, coerceToDate],
  );

  // Exibição
  const displayValue =
    selectedDate && isValid(selectedDate)
      ? format(selectedDate, displayFormat, { locale: ptBR })
      : '';

  // Helpers
  const handleSelect = (date?: Date) => {
    if (!date || !isValid(date)) {
      field.setValue(null); // sem data
    } else {
      // salva como NUMBER (epoch ms), truncado para início do dia local
      const ms = dayjs(date).startOf('day').valueOf();
      field.setValue(ms);
    }
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    field.setValue(null);
  };

  // regra de disabled combinando min/max com prop disabled do usuário
  const disabledFn = (date: Date) => {
    const minBlock = minDate ? date < stripTime(minDate) : false;
    const maxBlock = maxDate ? date > stripTime(maxDate) : false;
    const extra = disabled ? disabled(date) : false;
    return minBlock || maxBlock || extra;
  };

  const hasValue =
    field.state.value !== null && field.state.value !== undefined;

  return (
    <FieldWrapper>
      {label && <LabelArea label={label} htmlFor={id} required={required} />}

      <div className={cn('relative w-full', className)}>
        {/* Ícone à esquerda, como no InputField */}
        <span className="pointer-events-none absolute left-2 top-2.5 max-h-4 max-w-4">
          {Icon && <Icon className="h-4 w-4 opacity-45" />}
        </span>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id={id}
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal cursor-pointer',
                'pl-7',
                !selectedDate && 'text-muted-foreground',
              )}
            >
              {displayValue || 'Selecione uma data'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleSelect}
              initialFocus
              disabled={disabledFn}
              fromDate={minDate}
              toDate={maxDate}
              locale={ptBR}
              className="w-full"
            />
          </PopoverContent>
        </Popover>

        {/* Botão limpar */}
        {hasValue ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-2.5 inline-flex h-5 w-5 items-center justify-center rounded hover:bg-muted"
            aria-label="Limpar data"
          >
            <ClearIcon className="h-4 w-4 opacity-45" />
          </button>
        ) : null}
      </div>

      {description && <span className="text-sm opacity-45">{description}</span>}
      <FieldError />
    </FieldWrapper>
  );
};

export default DatePickerField;

/* Utils */
function stripTime(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
