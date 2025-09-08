import { FieldWrapper } from '../wrapper';
import { LabelArea } from '../label';
import { FieldError } from '../error';
import { useFieldContext } from '@/components/form/form-context';
import { FancyMultiSelect } from '@/components/ui/external/fancy-multi-select';

interface MultiSelectFieldProps {
  id: string;
  label?: string;
  description?: string;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

const MultiSelectField = ({
  id,
  label,
  description,
  options,
  placeholder = 'Selecione...',
  disabled,
  required,
}: MultiSelectFieldProps) => {
  // o valor no form será string[] (ids/values selecionados)
  const field = useFieldContext<string[]>();

  const selectedAsOptions = Array.isArray(field.state.value)
    ? field.state.value
    : [];

  const handleChange = (next: string[]) => {
    field.setValue(next);
  };

  return (
    <FieldWrapper>
      {label && <LabelArea label={label} htmlFor={id} required={required} />}

      <FancyMultiSelect
        suggestions={options}
        value={selectedAsOptions}
        onChange={handleChange}
        placeholder={placeholder}

        // disabled={disabled}
      />

      {description && <span className="text-sm opacity-45">{description}</span>}
      <FieldError />
    </FieldWrapper>
  );
};

export default MultiSelectField;
