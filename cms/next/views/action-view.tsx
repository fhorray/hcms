'use client';

/* NOTE: Comments must stay in English only. */

import { useOpaca } from '@/cms/hooks';
import { useAppForm } from '@/components/form/form-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, XIcon } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { DynamicField } from '../components';
import type { OpacaField, FieldTypeInput } from '@/cms/types';

export default function CollectionForm() {
  const router = useRouter();
  const { paths } = useParams() as { paths?: string[] };
  const collectionSlug = paths?.[0] ?? '';
  const maybeId = paths?.[1]; // present for "/:collection/:id"

  const {
    collections: { current },
    api: { create, update, get },
    isEditing,
    itemId,
  } = useOpaca();

  const itemData = get.data;

  if (!current) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-4">
          <div>
            <h2 className="text-2xl font-semibold">Collection not found</h2>
            <p className="text-muted-foreground">
              The collection "{collectionSlug}" does not exist.
            </p>
          </div>
          <Button onClick={() => router.push('/admin')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  type FormData = Record<string, any>;

  // ------------ helpers for defaults (supports row recursively) ------------
  const isRowType = (t: FieldTypeInput): t is { row: OpacaField[] } =>
    typeof t === 'object' && !!t && 'row' in t && Array.isArray((t as any).row);

  function applyDefaultsFromFields(
    fields: OpacaField[] | undefined,
    target: Record<string, any>,
  ) {
    if (!fields?.length) return target;

    for (const f of fields) {
      if (!f || !f.name) continue;

      // Layout/hidden handling: skip hidden fields from form if desired.
      // If you still want hidden defaults applied, remove this guard.
      if (f.hidden) continue;

      const t = f.type;

      // Row container: ensure nested object and recurse for children
      if (isRowType(t)) {
        const container = (target[f.name] ??= {});
        applyDefaultsFromFields(t.row, container);
        continue;
      }

      // Primitive/enum/relation: set default only if value is currently undefined
      const hasValue = target[f.name] !== undefined;
      if (!hasValue && 'default' in f && f.default !== undefined) {
        target[f.name] = f.default;
      }
    }
    return target;
  }

  // Build default values: start from itemData (edit case), then hydrate defaults from schema
  const getDefaultValues = (): Partial<FormData> => {
    const base: Record<string, any> = (itemData ?? {}) as Record<string, any>;
    return applyDefaultsFromFields(current.fields, { ...base });
  };

  const form = useAppForm({
    defaultValues: getDefaultValues(),
    onSubmit: async ({ value }) => {
      console.log({ value });
      if (isEditing && itemId) {
        update.mutate({ id: itemId, data: value });
      } else {
        create.mutate(value);
      }
    },
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/admin/${current.slug}`)}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {isEditing ? 'Edit' : 'Create'} {current.name.slice(0, -1)}
              </h1>
              <p className="text-muted-foreground">
                {isEditing
                  ? 'Update the existing item'
                  : 'Add a new item to the collection'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Item' : 'Create New Item'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
            className="space-y-6"
          >
            <div className="grid gap-6">
              {/* current.fields is now OpacaField[] */}
              {current.fields.map((field) => (
                <DynamicField
                  name={field.name}
                  key={field.name}
                  field={field}
                  form={form}
                />
              ))}
            </div>

            <div className="flex items-center justify-end gap-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                onClick={() => router.push(`/admin/${current.slug}`)}
              >
                <XIcon className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button className="cursor-pointer" type="submit">
                <Save className="w-4 h-4 mr-2" />
                {isEditing ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
