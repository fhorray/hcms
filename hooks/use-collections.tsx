'use client';

import { autoCrud } from '@/cms/client/crud';
import collections from '@/cms/collections';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/router';

export const useCollections = () => {
  const { collection, action } = useParams<{
    collection: string;
    action?: string;
  }>();

  const collectionData = Object.values(collections).find(
    (c) =>
      (c.name.toLowerCase() || c.name.toLowerCase().replace(/\s+/g, '-')) ===
      collection,
  );

  const isEditing = action !== 'create';
  const itemId = isEditing ? action : null;

  const crud = autoCrud[collection];

  return {
    isEditing,
    itemId,
    collection: collectionData || null,
    slug: collection || null,
    query: crud[collection as keyof typeof crud],
    api: {
      list: crud.useList(),
      item: crud.useItem,
      create: crud.useCreate(),
      update: crud.useUpdate(),
      remove: crud.useRemove(),
    },
  };
};
