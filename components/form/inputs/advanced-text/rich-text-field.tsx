import { FieldError } from '@/components/form/inputs/error';
import { LabelArea } from '@/components/form/inputs/label';
import { FieldWrapper } from '@/components/form/inputs/wrapper';
import { RichTextEditor } from '@/components/tiptap/editor';
import { ThemeProvider } from '@/components/tiptap/theme-context';
import { useFieldContext } from '@/components/form/form-context';
import { Content } from '@tiptap/core';
import { useRef } from 'react';

type TextEditorFieldProps = {
  label?: string;
  placeholder?: string;
  className?: string;
};

const TextEditorField = ({
  label,
  placeholder,
  className,
}: TextEditorFieldProps) => {
  const field = useFieldContext<string>();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (value: Content) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      field.setValue(value as string);
    }, 500);
  };

  return (
    <ThemeProvider>
      <FieldWrapper>
        {label && <LabelArea label={label} />}

        <RichTextEditor
          onChange={handleChange}
          placeholder={placeholder ?? 'Digite "/" para inserir um bloco...'}
          content={field.state.value}
        />

        <FieldError />
      </FieldWrapper>
    </ThemeProvider>
  );
};

export default TextEditorField;
