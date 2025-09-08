import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { FieldError } from '../error';
import { LabelArea } from '../label';
import { FieldWrapper } from '../wrapper';
import { useFieldContext } from '@/components/form/form-context';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  id: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  description?: string;
}

const FileInputField = ({
  label,
  icon: Icon,
  id,
  description,
  ...props
}: InputProps) => {
  const field = useFieldContext<File>();

  return (
    <FieldWrapper>
      {label && (
        <LabelArea label={label} htmlFor={id} required={props.required} />
      )}

      <div className="relative w-full">
        {Icon && (
          <span className="absolute top-2.5 left-2">
            <Icon className="w-4 h-4 opacity-45" />
          </span>
        )}

        <Input
          id={id}
          type="file"
          onChange={(e) =>
            field.setValue((e.target.files?.[0] as File) || null)
          }
          className={cn(Icon && 'pl-7 pb-1.5', props.className)}
          {...props}
        />

        {field.state.value && (
          <span className="block text-sm mt-1 opacity-70">
            {field.state.value.name}
          </span>
        )}
      </div>

      {description && <span className="text-sm opacity-45">{description}</span>}
      <FieldError />
    </FieldWrapper>
  );
};

export default FileInputField;
