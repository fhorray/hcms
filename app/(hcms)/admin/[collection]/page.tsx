'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowLeft, Database, Link } from 'lucide-react';

import collections from '@/cms/collections';
import { Select, Tables } from '@/cms/helpers/drizzle';
import { CollectionInput } from '@/cms/types';
import { CollectionHeader } from '@/components/cms/admin/collection-header';
import { CollectionItemsList } from '@/components/cms/admin/collection-items-list';
import { useCollections } from '@/hooks/use-collections';
import { useParams } from 'next/navigation';

export default function CollectionPage() {
  const { collection } = useParams();

  const {
    api: { list },
  } = useCollections();

  const collectionDbData = list.data;

  // console.log({ collectionDbData });

  const collectionData = collections.collections.find(
    (c) => c.name.toLowerCase().replace(/\s+/g, '-') === collection,
  ) as unknown as CollectionInput;

  if (!collectionData) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-4">
          <Database className="w-16 h-16 text-muted-foreground mx-auto" />
          <div>
            <h2 className="text-2xl font-semibold">Collection not found</h2>
            <p className="text-muted-foreground">
              The collection "{collection}" doesn't exist.
            </p>
          </div>
          <Link href="/admin">
            <Button>
              <div>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </div>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <CollectionHeader collection={collectionData} />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Items
            </CardTitle>
            <div className="text-2xl font-bold">{collectionDbData?.length}</div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Collection Slug
            </CardTitle>
            <div className="text-2xl font-bold">{collection}</div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Primary Key
            </CardTitle>
            <div className="text-2xl font-bold">
              {collectionData.name || 'id'}
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Items */}
      {collectionDbData?.length === 0 ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Collection Items
                </CardTitle>
                <CardDescription>
                  Sample data from the {collectionData.name} collection.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-8">
              No items found in this collection.
            </div>
          </CardContent>
        </Card>
      ) : (
        <CollectionItemsList
          items={collectionDbData as unknown as Select<Tables>[]}
        />
      )}
    </div>
  );
}
