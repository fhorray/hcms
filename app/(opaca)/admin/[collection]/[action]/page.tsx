'use client';

import { ColumnMeta } from '@/cms/builders';
import { DynamicField } from '@/components/cms/admin/dynamic-field';
import { useAppForm } from '@/components/form/form-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOpaca } from '@/new-cms/hooks/use-opaca';
import { ArrowLeft, Save, XIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

export default function CollectionForm() {
  const router = useRouter();
  const {
    collection: collectionData,
    isEditing,
    itemId,
    slug,
    query,
  } = useOpaca();

  const itemData = query?.useGetOne?.(itemId as string).data;

  if (!collectionData) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-4">
          <div>
            <h2 className="text-2xl font-semibold">Collection not found</h2>
            <p className="text-muted-foreground">
              The collection "{slug}" doesn't exist.
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

  type FormData = typeof collectionData;

  // Get default values
  const getDefaultValues = (): Partial<FormData> => {
    const defaults: any = itemData ?? {};

    Object.entries(collectionData?.fields).forEach(([fieldName, field]) => {
      if (
        typeof field !== 'string' &&
        !('enum' in field) &&
        !('relation' in field) &&
        'default' in field &&
        field.default !== undefined
      ) {
        defaults[fieldName] = field.default;
      }
    });

    return defaults;
  };

  const form = useAppForm({
    defaultValues: getDefaultValues() ?? ({} as FormData),
    onSubmit: async ({ value }) => {
      if (isEditing && itemId) {
        query.update?.mutate({ id: itemId, input: value });
      } else {
        query.create?.mutate(value);
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
              onClick={() => router.push(`/admin/${slug}`)}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                {isEditing ? 'Edit' : 'Create'}{' '}
                {collectionData?.tableName?.slice(0, -1)}
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
              {Object.values(collectionData).map((c: any, i) => {
                if (c.name === 'id') return null;
                return (
                  <DynamicField
                    key={i}
                    name={c.name}
                    field={c as ColumnMeta}
                    form={form}
                  />
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                onClick={() => router.push(`/admin/${slug}`)}
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
