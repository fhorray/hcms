import { createFormHookContexts } from '@tanstack/react-form';
import { createFormHook } from '@tanstack/react-form';
import { lazy } from 'react';

export const { fieldContext, useFieldContext, formContext, useFormContext } =
  createFormHookContexts();

// Actions
import { SubmitButton } from '@/components/form/inputs/actions/submit';

const InputField = lazy(
  () => import('@/components/form/inputs/text/text-input'),
);

const PasswordField = lazy(
  () => import('@/components/form/inputs/text/password-input'),
);

const SearchField = lazy(
  () => import('@/components/form/inputs/text/search-input'),
);

// ADVANCED TEXT
const TextAreaField = lazy(
  () => import('@/components/form/inputs/advanced-text/textarea-input'),
);
const RichTextField = lazy(
  () => import('@/components/form/inputs/advanced-text/rich-text-field'),
);

// NUMERIC INPUTS
const NumericField = lazy(
  () => import('@/components/form/inputs/numeric/number-input'),
);

const NumericSliderField = lazy(
  () => import('@/components/form/inputs/numeric/numeric-slider-input'),
);

// SELECTORS
const SelectField = lazy(
  () => import('@/components/form/inputs/selectors/select-field'),
);
const MultiSelectField = lazy(
  () => import('@/components/form/inputs/selectors/multi-select-field'),
);

const FileInputField = lazy(
  () => import('@/components/form/inputs/selectors/file-input.field'),
);

// SWITCHERS
const SwitcherField = lazy(
  () => import('@/components/form/inputs/switcher-field'),
);

// EPECIALIZED
const CEPField = lazy(
  () => import('@/components/form/inputs/specialized/cep-input'),
);
const CPFField = lazy(
  () => import('@/components/form/inputs/specialized/cpf-input'),
);

// COMPLEX / STRUCTURED
const KeyValuePairEditorField = lazy(
  () => import('@/components/form/inputs/complex/key-value-pair-editor'),
);
const JsonInputComponent = lazy(
  () => import('@/components/form/inputs/complex/json-input'),
);

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    InputField,
    PasswordField,
    SearchField,

    TextAreaField,
    RichTextField,

    NumericField,
    NumericSliderField,

    SelectField,
    MultiSelectField,
    FileInputField,

    SwitcherField,

    CEPField,
    CPFField,

    KeyValuePairEditorField,
    JsonInputComponent,
  },
  formComponents: {
    SubmitButton,
  },
});
