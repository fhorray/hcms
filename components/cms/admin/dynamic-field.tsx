'use client';

import { withForm } from '@/components/form/form-context';
import type { FieldDefInput, FieldTypeInput } from '@/cms/types';
import { ColumnMeta, TableCmsSchemaTyped } from '@/cms/builders';
import { Collection } from '@/new-cms/config/types';

type NormalizedField =
  | {
      kind: 'primitive';
      type: string; // guardamos o nome normalizado como string
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

// ---------- helpers de normalização ----------
const key = (s: string) => s.replace(/\s+/g, '').toLowerCase();

const isTopEnum = (x: any): x is { enum?: string[]; Enum?: string[] } =>
  x && typeof x === 'object' && ('enum' in x || 'Enum' in x);

const isTopRelation = (
  x: any,
): x is {
  relation?: { to: string; many?: boolean };
  Relation?: { to: string; many?: boolean };
} => x && typeof x === 'object' && ('relation' in x || 'Relation' in x);

// Decide modo do Number
const detectNumberMode = (src: any): 'int' | 'float' => {
  if (!src || typeof src !== 'object') return 'float';
  if (src.mode === 'int') return 'int';
  if (src.integer === true) return 'int';
  if (src.step === 1) return 'int';
  return 'float';
};

// Converte rótulos estilo Payload -> tokens antigos do seu switch
const canonPrimitive = (
  t: string,
  rawField?: any,
):
  | 'text'
  | 'rich-text'
  | 'boolean'
  | 'int'
  | 'float'
  | 'json'
  | 'date'
  | 'datetime'
  | 'text' => {
  const k = key(t);

  // estruturais (se preferir, retorne algo e trate adiante para não renderizar)
  if (
    k === 'array' ||
    k === 'blocks' ||
    k === 'group' ||
    k === 'row' ||
    k === 'tabs' ||
    k === 'ui' ||
    k === 'collapsible' ||
    k === 'join'
  ) {
    return 'text'; // fallback neutro (ou mude para retornar algo que você ignore)
  }

  if (
    k === 'text' ||
    k === 'email' ||
    k === 'url' ||
    k === 'code' ||
    k === 'markdown' ||
    k === 'textarea' ||
    k === 'select' || // quando for select sem opções, vira input padrão
    k === 'radiogroup' // idem; com opções use { Enum: [...] }
  ) {
    return 'text';
  }

  if (k === 'checkbox') return 'boolean';
  if (k === 'json') return 'json';
  if (k === 'rich-text') return 'rich-text';
  if (k === 'date') return 'date';
  if (k === 'datetime' || k === 'datetime') return 'datetime';
  if (k === 'number') {
    return detectNumberMode(rawField) === 'int' ? 'int' : 'float';
  }

  if (k === 'point') {
    // sem UI específica: trate como JSON para edição
    return 'json';
  }

  // relationship é tratado fora
  if (k === 'relationship') {
    // não deveria cair aqui; normalizeFieldDef cuidará disso
    return 'text';
  }

  return 'text';
};

function normalizeFieldDef(input: ColumnMeta): NormalizedField {
  // string direta ('Text', 'RichText', etc.)
  if (typeof input === 'string') {
    return { kind: 'primitive', type: input };
  }

  // top-level Enum / Relation (aceita maiúsculo/minúsculo)
  if (isTopEnum(input)) {
    const e = (input as any).enum ?? (input as any).Enum ?? [];
    return { kind: 'enum', enum: e };
  }
  if (isTopRelation(input)) {
    const r = (input as any).relation ?? (input as any).Relation;
    return { kind: 'relation', relation: r };
  }

  // FieldDefInput com .type
  const { type, required, default: def } = input as any;

  if (typeof type === 'string') {
    return {
      kind: 'primitive',
      type,
      required,
      default: def,
    };
  }

  // type como objeto { Enum } ou { Relation }
  if (type && typeof type === 'object') {
    if ('enum' in type || 'Enum' in type) {
      const e = (type as any).enum ?? (type as any).Enum ?? [];
      return { kind: 'enum', enum: e, required, default: def };
    }
    if ('relation' in type || 'Relation' in type) {
      const r = (type as any).relation ?? (type as any).Relation;
      return { kind: 'relation', relation: r, required, default: def };
    }
  }

  // fallback
  return { kind: 'primitive', type: 'Text', required, default: def };
}

interface DynamicFieldProps {
  name: string;
  field: Collection['fields'][number];
  label?: string;
  description?: string;
}

export const DynamicField = withForm({
  props: {} as DynamicFieldProps,
  defaultValues: {} as Partial<Collection>,
  render: ({ form, name, field, description, label }) => {
    const info = normalizeFieldDef(field);
    const renderLabel = label ?? name.charAt(0).toUpperCase() + name.slice(1);

    return (
      <form.AppField name={'fields'}>
        {(fieldForm) => {
          if (info.kind === 'primitive') {
            // converte os tipos estilo Payload para os tokens do seu switch antigo
            const token = canonPrimitive(info.type, field);

            switch (token) {
              case 'text':
                return (
                  <fieldForm.InputField
                    id={name}
                    label={renderLabel ?? name}
                    description={description}
                    placeholder={`Type ${name}...`}
                  />
                );

              case 'rich-text':
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
                  <fieldForm.NumberField
                    id={name}
                    label={renderLabel ?? name}
                    description={description}
                    step={1}
                    placeholder={`Digite ${name}...`}
                  />
                );

              case 'float':
                return (
                  <fieldForm.NumberField
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
                return (
                  <fieldForm.DateField
                    id={name}
                    label={renderLabel ?? name}
                    description={description}
                    displayFormat="dd/MM/yyyy HH:mm"
                  />
                );

              case 'datetime':
                return (
                  <fieldForm.DateField
                    id={name}
                    label={renderLabel ?? name}
                    description={description}
                    displayFormat="dd/MM/yyyy HH:mm"
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

            // demo options (substitua por fetch real)
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
