'use client';

import { slugify } from '@/lib/utils';
import config from '@opaca-config';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { OpacaCollection } from '../types';
import * as schema from '../server/db/schema';

export const useOpaca = () => {
  const { collection: collectionSlug, action } = useParams<{
    collection: string;
    action?: string;
  }>();

  const collection = {
    ...Object.values(config.collections).find(
      (c) =>
        c.slug === collectionSlug ||
        c.name.toLowerCase() === collectionSlug?.toLowerCase(),
    ),

    slug: slugify(collectionSlug ?? 'unknown'),
  };

  const isEditing = action !== 'create';
  const itemId = isEditing ? action : null;

  const api = {
    // GET ALL ITEMS
    list: useQuery({
      queryKey: ['opaca', 'list', collection.slug],
      queryFn: async () => {
        const res = await fetch(`/api/${collection.slug}`);
        return res.json();
      },
    }),

    // GET SINGLE ITEM
    get: useQuery({
      queryKey: ['opaca', 'get', collection.slug, itemId],
      queryFn: async () => {
        if (!itemId) return null;
        const res = await fetch(`/api/${collection.slug}/${itemId}`);
        return res.json();
      },
      enabled: !!itemId,
    }),

    // CREATE ITEM
    create: async (data: Record<string, any>) => {
      const res = await fetch(`/api/${collection.slug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return res.json();
    },

    // UPDATE ITEM
    update: async (id: string, data: Record<string, any>) => {
      const res = await fetch(`/api/${collection.slug}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return res.json();
    },

    // PATCH ITEM
    patch: async (id: string, data: Record<string, any>) => {
      const res = await fetch(`/api/${collection.slug}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return res.json();
    },

    // DELETE ITEM
    delete: async (id: string) => {
      const res = await fetch(`/api/${collection.slug}/${id}`, {
        method: 'DELETE',
      });
      return res.json();
    },
  };

  return {
    isEditing,
    itemId,
    stats: {
      totalCollections: Object.values(config.collections).length,
      totalFields: Object.values(config.collections).reduce(
        (acc, collection) => acc + Object.keys(collection.fields).length,
        0,
      ),
    },
    collections: {
      current: collection as OpacaCollection,
      stats: {
        totalFields: Object.keys(collection?.fields || {}).length,
        totalItems: 0, // TODO: implement trhough API
      },
    },
    api,
    admin: config.admin,
    index: config._index,
    database: config.database,
  };
};
