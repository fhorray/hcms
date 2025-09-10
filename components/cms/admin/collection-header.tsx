import { OpacaCollection } from '@/cms/types';
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

export const CollectionHeader = ({
  collection,
}: {
  collection: OpacaCollection;
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
            <h1 className="text-3xl font-bold">{collection.name}</h1>
            <p className="text-muted-foreground">
              Manage {collection.name.toLowerCase()} collection
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
        <Link
          href={`/admin/${
            collection.slug || collection.name.toLowerCase()
          }/create`}
        >
          <Button size="sm" className="cursor-pointer">
            <PlusIcon className="w-4 h-4 mr-2" />
            Add New
          </Button>
        </Link>
      </div>
    </div>
  );
};
