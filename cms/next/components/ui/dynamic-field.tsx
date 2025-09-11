'use client';

/* NOTE: Comments must stay in English only. */
import React, { useEffect, useMemo, useState } from 'react';
import type { BaseOpacaField, FieldTypeInput, OpacaField } from '@/cms/types';
import { withForm } from '@/components/form/form-context';
import { captalize } from '@/lib/utils';
import { TApiResponse } from '@/cms/hooks';
import { useQueryClient } from '@tanstack/react-query';

/* ---------- Normalized UI model ---------- */
type SelectOption = { label: string; value: string | number };

type NormalizedField =
  | {
      kind: 'primitive';
      type: string;
      required?: boolean;
      default?: unknown;
      hidden?: boolean;
    }
  | {
      kind: 'enum';
      enum: string[];
      required?: boolean;
      default?: unknown;
      hidden?: boolean;
    }
  | {
      kind: 'relation';
      relation: { to: string; many?: boolean; through?: string };
      required?: boolean;
      default?: unknown;
      hidden?: boolean;
    }
  | {
      kind: 'row';
      hidden?: boolean;
      fields: Array<{
        name: string;
        field: OpacaField;
        col?: number;
      }>;
    }
  | {
      kind: 'select';
      multiple?: boolean;
      /* Static options (if provided in config) */
      options?: SelectOption[];
      /* Dynamic relationship-backed select */
      relationship?: { to: string; valueField: string };
      required?: boolean;
      default?: unknown;
      hidden?: boolean;
    };

/* ---------- helpers ---------- */
const isTopEnum = (x: any): x is { enum?: string[]; Enum?: string[] } =>
  x && typeof x === 'object' && ('enum' in x || 'Enum' in x);

const isTopRelation = (
  x: any,
): x is {
  relation?: { to: string; many?: boolean; through?: string };
  Relation?: { to: string; many?: boolean; through?: string };
  relationship?: { to: string; many?: boolean; through?: string };
} =>
  x &&
  typeof x === 'object' &&
  ('relation' in x || 'Relation' in x || 'relationship' in x);

/* Validate col span within 1..12 and return a Tailwind col-span-* class */
const colClass = (n?: number) => {
  const v = Math.max(1, Math.min(12, n ?? 6)); // default 6 -> two columns
  const map: Record<number, string> = {
    1: 'col-span-1',
    2: 'col-span-2',
    3: 'col-span-3',
    4: 'col-span-4',
    5: 'col-span-5',
    6: 'col-span-6',
    7: 'col-span-7',
    8: 'col-span-8',
    9: 'col-span-9',
    10: 'col-span-10',
    11: 'col-span-11',
    12: 'col-span-12',
  };
  return map[v] ?? 'col-span-6';
};

function cap(s: string) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function toSelectOptions(
  arr: Array<{ label?: any; value?: any }>,
): SelectOption[] {
  return (arr || []).map((o, i) => ({
    label:
      typeof o?.label === 'string'
        ? o.label
        : o?.label != null
        ? String(o.label)
        : `Option ${i + 1}`,
    value:
      typeof o?.value === 'number' || typeof o?.value === 'string'
        ? o.value
        : i,
  }));
}

/* Heuristics to guess label/value fields from fetched items */
function guessLabelKey(sample: any, hint?: string) {
  if (hint && sample && sample[hint] != null) return hint;
  for (const k of ['name', 'title', 'email', 'label']) {
    if (sample && typeof sample[k] === 'string') return k;
  }
  const strKey = Object.keys(sample || {}).find(
    (k) => typeof sample[k] === 'string',
  );
  return strKey ?? 'id';
}
function guessValueKey(sample: any) {
  if (sample && 'id' in sample) return 'id';
  const first = Object.keys(sample || {})[0];
  return first ?? 'id';
}

/* ---------- normalization ---------- */
function normalizeFieldDef(
  input: OpacaField | FieldTypeInput,
): NormalizedField {
  // Simple string type (e.g., 'text', 'number', 'rich-text', etc.)
  if (typeof input === 'string') {
    return { kind: 'primitive', type: input };
  }

  // Top-level Enum / Relation / Relationship
  if (isTopEnum(input)) {
    const e = (input as any).enum ?? (input as any).Enum ?? [];
    return { kind: 'enum', enum: e };
  }
  if (isTopRelation(input)) {
    const r =
      (input as any).relation ??
      (input as any).Relation ??
      (input as any).relationship;
    return { kind: 'relation', relation: r };
  }

  // Handle bare { row: OpacaField[] }
  if (typeof input === 'object' && 'row' in (input as any)) {
    const rowItems = (input as any).row as OpacaField[];
    const normalizedChildren = (rowItems || []).map((child) => ({
      name: (child as BaseOpacaField).name ?? 'col',
      field: child,
      col: child.layout?.col,
    }));
    return { kind: 'row', fields: normalizedChildren };
  }

  // OpacaField with .type
  const f = input as OpacaField;
  const { type, required } = f;
  const def = 'default' in f ? (f as any).default : undefined;

  // Row container inside field.type
  if (typeof type === 'object' && type && 'row' in type) {
    const rowItems = (type as any).row as OpacaField[];
    const normalizedChildren = (rowItems || []).map((child) => ({
      name: (child as BaseOpacaField).name ?? 'col',
      field: child,
      col: child.layout?.col,
    }));
    return { kind: 'row', fields: normalizedChildren };
  }

  // Object forms: enum, (relation|relationship), select
  if (typeof type === 'object' && type) {
    // Legacy enum
    if ('enum' in type || 'Enum' in type) {
      const e = (type as any).enum ?? (type as any).Enum ?? [];
      return {
        kind: 'enum',
        enum: e,
        required,
        default: def,
        hidden: f.hidden,
      };
    }

    // relation / relationship with many/through
    if ('relationship' in type || 'relation' in type || 'Relation' in type) {
      const r =
        (type as any).relation ??
        (type as any).Relation ??
        (type as any).relationship;
      return {
        kind: 'relation',
        relation: r,
        required,
        default: def,
        hidden: f.hidden,
      };
    }

    // select: static options and/or relationship-backed
    if ('select' in type) {
      const sel = (type as any).select ?? {};
      const options = Array.isArray(sel.options)
        ? toSelectOptions(sel.options)
        : undefined;
      const multiple = !!sel.multiple;
      const relationship = sel.relationship
        ? {
            to: String(sel.relationship.to),
            valueField: String(sel.relationship.valueField),
          }
        : undefined;

      return {
        kind: 'select',
        multiple,
        options,
        relationship,
        required,
        default: def,
        hidden: f.hidden,
      };
    }
  }

  // Primitive declared as string in field.type
  if (typeof type === 'string') {
    return {
      kind: 'primitive',
      type,
      required,
      default: def,
      hidden: f.hidden,
    };
  }

  // Final fallback
  return { kind: 'primitive', type: 'text', required, default: def };
}

/* ---------- render helpers (hook-using subcomponents) ---------- */

type FieldRenderCommon = {
  name: string;
  label: string;
  description?: string;
  form: any;
};

/* Dynamic SELECT that may be static or relationship-backed */
function SelectRenderer({
  info,
  name,
  label,
  description,
  form,
}: FieldRenderCommon & { info: Extract<NormalizedField, { kind: 'select' }> }) {
  const [relOptions, setRelOptions] = useState<SelectOption[] | null>(null);
  const [loading, setLoading] = useState(false);

  const isRel = !!info.relationship;

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!isRel) return;
      setLoading(true);
      try {
        const to = info.relationship!.to;
        const valueField = info.relationship!.valueField;
        const res = await fetch(`/api/${to}`);
        const { data } = (await res.json()) as TApiResponse<any>;
        const first = Array.isArray(data) && data.length > 0 ? data[0] : {};
        const labelKey = guessLabelKey(first, valueField); // use valueField as a hint for label
        const valueKey =
          first && valueField in first ? valueField : guessValueKey(first);

        const opts: SelectOption[] = (Array.isArray(data) ? data : []).map(
          (row: any, i: number) => ({
            label:
              row?.[labelKey] != null ? String(row[labelKey]) : `Item ${i + 1}`,
            value: row?.[valueKey] != null ? (row[valueKey] as any) : i,
          }),
        );
        if (alive) setRelOptions(opts);
      } catch {
        if (alive) setRelOptions([]);
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [isRel, info.relationship?.to, info.relationship?.valueField]);

  const options: SelectOption[] = useMemo(() => {
    if (isRel) return relOptions ?? [];
    return info.options ?? [];
  }, [isRel, relOptions, info.options]);

  if (info.multiple) {
    /* 
      If your MultiSelectField only supports string[], replace options={options}
      by options={options.map(o => o.label)} (but you'll lose distinct values).
    */
    return (
      <form.MultiSelectField
        id={name}
        label={label}
        description={description}
        options={options as any}
        disabled={loading}
        placeholder={loading ? 'Loading...' : `Select multiple...`}
      />
    );
  }

  return (
    <form.SelectField
      id={name}
      label={label}
      options={options}
      description={description}
      disabled={loading}
      placeholder={loading ? 'Loading...' : `Select ${name}...`}
    />
  );
}

/* Relationship (not the select wrapper) */
function RelationRenderer({
  info,
  name,
  label,
  description,
  form,
}: FieldRenderCommon & {
  info: Extract<NormalizedField, { kind: 'relation' }>;
}) {
  const [options, setOptions] = useState<SelectOption[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/${info.relation.to}`);
        const { data } = (await res.json()) as TApiResponse<any>;
        const first = Array.isArray(data) && data.length > 0 ? data[0] : {};
        const labelKey = guessLabelKey(first);
        const valueKey = guessValueKey(first);
        const opts: SelectOption[] = (Array.isArray(data) ? data : []).map(
          (row: any, i: number) => ({
            label:
              row?.[labelKey] != null ? String(row[labelKey]) : `Item ${i + 1}`,
            value: row?.[valueKey] != null ? (row[valueKey] as any) : i,
          }),
        );
        if (alive) setOptions(opts);
      } catch {
        if (alive) setOptions([]);
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [info.relation.to]);

  if (info.relation.many) {
    return (
      <form.MultiSelectField
        id={name}
        label={label}
        description={description ?? `Relates to ${info.relation.to} (many)`}
        options={(options ?? []) as any}
        disabled={loading}
        placeholder={loading ? 'Loading...' : `Select multiple...`}
      />
    );
  }

  return (
    <form.SelectField
      id={name}
      label={label}
      options={options ?? []}
      description={description ?? `Relates to ${info.relation.to}`}
      disabled={loading}
      placeholder={loading ? 'Loading...' : `Select ${info.relation.to}...`}
    />
  );
}

/* ---------- main DynamicField ---------- */

interface DynamicFieldProps {
  name: string; // path in form data
  field: OpacaField;
  label?: string;
  description?: string;
}

export const DynamicField = withForm({
  props: {} as DynamicFieldProps,
  defaultValues: {} as Partial<Record<string, any>>,
  render: ({ form, name, field, description, label }) => {
    const info = normalizeFieldDef(field);
    const renderLabel = label ?? captalize(name);
    if (info.hidden) return <></>;

    return (
      <form.AppField name={(field as BaseOpacaField).name}>
        {(fieldForm: any) => {
          if (info.kind === 'primitive') {
            const type = info.type as FieldTypeInput;

            switch (type) {
              case 'text':
                return (
                  <fieldForm.InputField
                    id={name}
                    label={renderLabel}
                    description={description}
                    placeholder={`Type ${name}...`}
                  />
                );
              case 'email':
                return (
                  <fieldForm.InputField
                    id={name}
                    type="email"
                    label={renderLabel}
                    description={description}
                    placeholder={`email@example.com`}
                  />
                );
              case 'textarea':
                return (
                  <fieldForm.TextAreaField
                    id={name}
                    label={renderLabel}
                    description={description}
                    placeholder={`Type ${name}...`}
                  />
                );
              case 'rich-text':
                return (
                  <fieldForm.RichTextField
                    label={renderLabel}
                    placeholder={`Type ${name}...`}
                  />
                );
              case 'switcher':
                return (
                  <fieldForm.SwitcherField id={name} label={renderLabel} />
                );
              case 'checkbox':
                return (
                  <fieldForm.InputField
                    id={name}
                    type="checkbox"
                    label={renderLabel}
                    description={description}
                    className="w-4.5 h-4.5 cursor-pointer"
                  />
                );
              case 'number':
                return (
                  <fieldForm.NumberField
                    id={name}
                    label={renderLabel}
                    description={description}
                    step={1}
                    placeholder={`Type ${name}...`}
                  />
                );
              case 'json':
                return (
                  <fieldForm.JsonInputComponent
                    id={name}
                    label={renderLabel}
                    description={description ?? 'Enter a valid JSON'}
                  />
                );
              case 'date':
                return (
                  <fieldForm.DateField
                    id={name}
                    label={renderLabel}
                    description={description}
                    displayFormat="dd/MM/yyyy HH:mm"
                  />
                );
              default:
                return (
                  <fieldForm.InputField
                    id={name}
                    label={renderLabel}
                    description={description}
                    placeholder={`Type ${name}...`}
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
                label={renderLabel}
                options={options}
                placeholder={`Select ${name}...`}
              />
            );
          }

          if (info.kind === 'relation') {
            return (
              <RelationRenderer
                info={info}
                name={name}
                label={renderLabel}
                description={description}
                form={fieldForm}
              />
            );
          }

          if (info.kind === 'row') {
            return (
              <div className="grid grid-cols-12 gap-4 w-full">
                {info.fields.map((child, idx) => {
                  const childLabel =
                    typeof child.field === 'object' && 'name' in child.field
                      ? cap((child.field as BaseOpacaField).name)
                      : `${renderLabel} ${idx + 1}`;
                  const childName = `${name}.${child.name}`;
                  return (
                    <div key={childName} className={colClass(child.col)}>
                      <DynamicField
                        name={childName}
                        field={child.field}
                        label={childLabel}
                        form={form}
                      />
                    </div>
                  );
                })}
              </div>
            );
          }

          if (info.kind === 'select') {
            return (
              <SelectRenderer
                info={info}
                name={name}
                label={renderLabel}
                description={description}
                form={fieldForm}
              />
            );
          }

          // Final fallback (should never reach here)
          return (
            <fieldForm.InputField
              id={name}
              label={renderLabel}
              description={description}
              placeholder={`Type ${name}...`}
            />
          );
        }}
      </form.AppField>
    );
  },
});
