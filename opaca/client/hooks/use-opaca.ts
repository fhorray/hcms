'use client';

import { slugify } from '@/lib/utils';
import { OpacaApiResponse } from '@/opaca/server/mount-rest';
import { OpacaCollection } from '@/opaca/types/config';
import * as config from '@opaca-config';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';

export const useOpaca = () => {
  const qc = useQueryClient();

  const { paths } = useParams() as { paths?: string[] };
  const collectionSlug = paths?.[0] ?? '';
  const action = paths?.[1]; // present for "/:collection/:id"

  const collection = {
    ...Object.values(config.clientConfig.collections).find(
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
        const data = await res.json() as OpacaApiResponse<any[]>
        return data;
      },
      enabled: !!collection.slug,
    }),

    // GET SINGLE ITEM
    get: useQuery({
      queryKey: ['opaca', 'get', collection.slug, itemId],
      queryFn: async () => {
        if (!itemId) return null;
        const res = await fetch(`/api/${collection.slug}/${itemId}`);
        const data = await res.json() as OpacaApiResponse<any>
        return data;
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
        const resData = await res.json() as OpacaApiResponse<any>
        return resData;
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
        const resData = await res.json() as OpacaApiResponse<any>
        return resData;
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
        const resData = await res.json() as OpacaApiResponse<any>
        return resData;
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
        const data = await res.json() as OpacaApiResponse<any>
        return data;
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
      totalCollections: Object.values(config.clientConfig.collections).length,
      totalFields: Object.values(config.clientConfig.collections).reduce(
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
    admin: config.clientConfig.admin,
    index: config.clientConfig._index,
    // database: config.clientConfig.database,
  };
};
