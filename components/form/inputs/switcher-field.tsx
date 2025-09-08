import {
  useFieldContext,
  useFormContext,
} from '@/components/form/form-context';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { LabelArea } from './label';
import { FieldWrapper } from './wrapper';

interface SwitcherFieldProps
  extends React.ComponentProps<typeof SwitchPrimitive.Root> {
  label?: string;
}

const SwitcherField = ({ label, className, ...props }: SwitcherFieldProps) => {
  const field = useFieldContext<boolean>();

  return (
    <div className="w-fit flex flex-col gap-4">
      <FieldWrapper>
        {label && <LabelArea label={label} />}
        <Switch
          className={cn('hover:cursor-pointer', className)}
          checked={field.state.value}
          onCheckedChange={field.setValue}
          {...props}
        />
      </FieldWrapper>
    </div>
  );
};

export default SwitcherField;
