import { useFormContext } from '@/components/form/form-context';
import { Button } from '@/components/ui/button';
import { ComponentProps } from 'react';

interface SubmitButtonProps extends ComponentProps<'button'> {
  label: string;
  classname?: string;
}

export const SubmitButton = ({ label, ...props }: SubmitButtonProps) => {
  const form = useFormContext();
  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <Button disabled={isSubmitting} {...props}>
          {label}
        </Button>
      )}
    </form.Subscribe>
  );
};
