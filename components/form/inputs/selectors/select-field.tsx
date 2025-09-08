import {
  useFieldContext,
  useFormContext,
} from '@/components/form/form-context';
import { FieldError } from '../error';
import { LabelArea } from '../label';
import { FieldWrapper } from '../wrapper';

interface SelectFieldProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options:
    | { value: string; label: string }[]
    | {
        label?: string;
        isGroup: true;
        options: {
          value: string;
          label: string;
        }[];
      }[];
  placeholder?: string;
  id: string;
}

const SelectField = ({
  label,
  options,
  placeholder,
  id,
  ...props
}: SelectFieldProps) => {
  const field = useFieldContext<string>();

  return (
    <FieldWrapper>
      {label && (
        <LabelArea label={label} htmlFor={id} required={props.required} />
      )}

      <select
        id={id}
        className="w-full border-input data-[placeholder]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-[7px] text-sm shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 hover:cursor-pointer"
        value={field.state.value || ''}
        onChange={(e) => field.setValue(e.target.value)}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) =>
          'isGroup' in opt ? (
            <optgroup key={opt.label} label={opt.label}>
              {opt.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </optgroup>
          ) : (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ),
        )}
      </select>

      <FieldError />
    </FieldWrapper>
  );
};

export default SelectField;
