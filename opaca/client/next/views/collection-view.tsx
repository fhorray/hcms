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

import { useOpaca } from '@opaca/client/hooks';

import { useParams } from 'next/navigation';
import { OpacaCollection } from '@opaca/types/config';
import CollectionHeader from '../components/ui/collection-header';
import CollectionItemsList from '../components/ui/collection-items-list';
import { useRouter } from 'next/router';

export default function CollectionPage() {
  const { paths } = useParams() as { paths?: string[] };
  const collectionSlug = paths?.[0] ?? '';
  const maybeId = paths?.[1]; // present for "/:collection/:id"

  const {
    api,
    collections: { current },
  } = useOpaca();

  const collectionItems = api.list.data as OpacaCollection[];

  if (!current) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-4">
          <Database className="w-16 h-16 text-muted-foreground mx-auto" />
          <div>
            <h2 className="text-2xl font-semibold">Collection not found</h2>
            <p className="text-muted-foreground">
              The collection "{collectionSlug}" doesn't exist.
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
      <CollectionHeader collection={current} />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Items
            </CardTitle>
            <div className="text-2xl font-bold">{collectionItems?.length}</div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Collection Slug
            </CardTitle>
            <div className="text-2xl font-bold">{collectionSlug}</div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Primary Key
            </CardTitle>
            <div className="text-2xl font-bold">{'id'}</div>
          </CardHeader>
        </Card>
      </div>

      {/* Items */}
      {collectionItems?.length === 0 ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Collection Items
                </CardTitle>
                <CardDescription>
                  Sample data from the {current.name} collection.
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
        <CollectionItemsList items={collectionItems || []} />
      )}
    </div>
  );
}
