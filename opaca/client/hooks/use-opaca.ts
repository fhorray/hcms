'use client';

import { slugify } from '@/lib/utils';
import { OpacaCollection } from '@/opaca/types/config';
import config from '@opaca-config';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';

export const useOpaca = () => {
  const qc = useQueryClient();

  const { paths } = useParams() as { paths?: string[] };
  const collectionSlug = paths?.[0] ?? '';
  const action = paths?.[1]; // present for "/:collection/:id"

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
      enabled: !!collection.slug,
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
    create: useMutation({
      mutationFn: async (data: Record<string, any>) => {
        const res = await fetch(`/api/${collection.slug}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        return res.json();
      },
      onSuccess: () => {
        // invalidate list so UI refetches automatically
        qc.invalidateQueries({ queryKey: ['opaca', 'list', collection.slug] });
      },
    }),

    // UPDATE ITEM
    update: useMutation({
      mutationFn: async ({
        id,
        data,
      }: {
        id: string;
        data: Record<string, any>;
      }) => {
        const res = await fetch(`/api/${collection.slug}/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        return res.json();
      },
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['opaca', 'list', collection.slug] });
        qc.invalidateQueries({ queryKey: ['opaca', 'get', collection.slug] });
      },
    }),

    // PATCH ITEM
    patch: useMutation({
      mutationFn: async ({
        id,
        data,
      }: {
        id: string;
        data: Record<string, any>;
      }) => {
        const res = await fetch(`/api/${collection.slug}/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        return res.json();
      },
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['opaca', 'list', collection.slug] });
        qc.invalidateQueries({ queryKey: ['opaca', 'get', collection.slug] });
      },
    }),

    // DELETE ITEM
    delete: useMutation({
      mutationFn: async (id: string) => {
        const res = await fetch(`/api/${collection.slug}/${id}`, {
          method: 'DELETE',
        });
        return res.json();
      },
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['opaca', 'list', collection.slug] });
      },
    }),
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
