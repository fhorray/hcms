import { CollectionInput } from '@/cms/types';
import { Button } from '@/components/ui/button';
import {
  ArrowLeftIcon,
  DatabaseZapIcon,
  PlusIcon,
  SettingsIcon,
} from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { CollectionFieldsInfo } from './collection-fields-info';
import { TableCmsSchemaTyped } from '@/cms/builders';
import { slugify } from '@/lib/utils';
import { Collection } from '@/new-cms/config/types';

export const CollectionHeader = ({
  collection,
}: {
  collection: Collection;
}) => {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin">
              <ArrowLeftIcon className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {collection.tableName
                ? collection.tableName.charAt(0).toUpperCase() +
                  collection.tableName.slice(1)
                : ''}
            </h1>
            <p className="text-muted-foreground">
              Manage {collection.tableName?.toLowerCase()} collection
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <CollectionFieldsInfo collection={collection} />
        <Button variant="outline" size="sm" className="cursor-pointer">
          <SettingsIcon className="w-4 h-4 mr-2" />
          Configure
        </Button>
        <Link href={`/admin/${slugify(collection.tableName as string)}/create`}>
          <Button size="sm" className="cursor-pointer">
            <PlusIcon className="w-4 h-4 mr-2" />
            Add New
          </Button>
        </Link>
      </div>
    </div>
  );
};
