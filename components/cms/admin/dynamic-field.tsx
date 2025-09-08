'use client';

import collections from '@/cms/collections';
import { withForm } from '@/components/form/form-context';
import type { FieldDefInput, FieldTypeInput } from '@/cms/types';

type NormalizedField =
  | {
      kind: 'primitive';
      type: FieldTypeInput;
      required?: boolean;
      default?: unknown;
    }
  | { kind: 'enum'; enum: string[]; required?: boolean; default?: unknown }
  | {
      kind: 'relation';
      relation: { to: string; many?: boolean };
      required?: boolean;
      default?: unknown;
    };

function normalizeFieldDef(
  input: FieldDefInput | FieldTypeInput,
): NormalizedField {
  if (typeof input === 'string') {
    return { kind: 'primitive', type: input as FieldTypeInput };
  }

  if ('enum' in input) {
    return { kind: 'enum', enum: input.enum };
  }
  if ('relation' in input) {
    return { kind: 'relation', relation: input.relation };
  }

  // FieldDefInput completo
  const { type, required, default: def } = input;

  if (typeof type === 'string') {
    return {
      kind: 'primitive',
      type: type as FieldTypeInput,
      required,
      default: def,
    };
  }
  if ('enum' in type) {
    return { kind: 'enum', enum: type.enum, required, default: def };
  }
  if ('relation' in type) {
    return {
      kind: 'relation',
      relation: type.relation,
      required,
      default: def,
    };
  }

  // fallback
  return { kind: 'primitive', type: 'text', required, default: def };
}

interface DynamicFieldProps {
  name: string;
  field: FieldDefInput | FieldTypeInput;
  label?: string; // opcional: se quiser renderizar em seus FieldComponents
  description?: string; // opcional: idem
}

export const DynamicField = withForm({
  props: {} as DynamicFieldProps,
  defaultValues: {},
  render: ({ form, name, field, description, label }) => {
    const info = normalizeFieldDef(field);
    const renderLabel = label ?? name.charAt(0).toUpperCase() + name.slice(1);

    return (
      <form.AppField name={name}>
        {(fieldForm) => {
          if (info.kind === 'primitive') {
            switch (info.type) {
              case 'text':
                return (
                  <fieldForm.InputField
                    id={name}
                    label={renderLabel ?? name}
                    description={description}
                    placeholder={`Type ${name}...`}
                  />
                );

              case 'richtext':
                return (
                  <fieldForm.RichTextField
                    label={renderLabel ?? name}
                    placeholder={`Type ${name}...`}
                  />
                );

              case 'boolean':
                return (
                  <fieldForm.SwitcherField
                    id={name}
                    label={renderLabel ?? name}
                  />
                );

              case 'int':
                return (
                  <fieldForm.NumericField
                    id={name}
                    label={renderLabel ?? name}
                    description={description}
                    step={1}
                    placeholder={`Digite ${name}...`}
                  />
                );

              case 'float':
                return (
                  <fieldForm.NumericField
                    id={name}
                    label={renderLabel ?? name}
                    description={description}
                    step={0.01}
                    placeholder={`Digite ${name}...`}
                  />
                );

              case 'json':
                return (
                  <fieldForm.JsonInputComponent
                    id={name}
                    label={renderLabel ?? name}
                    description={description ?? 'Informe um JSON válido'}
                  />
                );

              case 'date':
                // usa input nativo de data (deixe seu InputField repassar type)
                return (
                  <fieldForm.InputField
                    id={name}
                    label={renderLabel ?? name}
                    description={description}
                    type="date"
                    placeholder="Selecione a data..."
                  />
                );

              case 'datetime':
                // usa input nativo de datetime-local
                return (
                  <fieldForm.InputField
                    id={name}
                    label={renderLabel ?? name}
                    description={description}
                    type="datetime-local"
                    placeholder="Selecione data e hora..."
                  />
                );
            }
          }

          if (info.kind === 'enum') {
            const options = info.enum.map((opt) => ({
              label: opt,
              value: opt,
            }));
            return (
              <fieldForm.SelectField
                id={name}
                label={renderLabel ?? name}
                options={options}
                placeholder={`Selecione ${name}...`}
              />
            );
          }

          if (info.kind === 'relation') {
            const target = info.relation.to;

            // single relation
            const demoOptions = [
              { label: `Demo ${target} 1`, value: 'demo-item-1' },
              { label: `Demo ${target} 2`, value: 'demo-item-2' },
            ];

            if (info.relation.many) {
              return (
                <fieldForm.MultiSelectField
                  id={name}
                  label={renderLabel ?? name}
                  description={
                    description ?? `Relaciona com ${target} (múltiplos)`
                  }
                  options={demoOptions.map((o) => o.label)}
                  placeholder={`Selecione múltiplos ${target}...`}
                />
              );
            }

            return (
              <fieldForm.SelectField
                id={name}
                label={renderLabel ?? name}
                // description={description ?? `Relaciona com ${target}`}
                options={demoOptions}
                placeholder={`Selecione ${target}...`}
              />
            );
          }

          // fallback
          return (
            <fieldForm.InputField
              id={name}
              label={renderLabel ?? name}
              description={description}
              placeholder={`Digite ${name}...`}
            />
          );
        }}
      </form.AppField>
    );
  },
});
