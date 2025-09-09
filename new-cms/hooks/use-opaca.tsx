'use client';

import { useStore } from '@nanostores/react';
import { $opaca, type TOpacaState } from '../stores/context';
import { useParams } from 'next/navigation';
import { useHcmsApi } from '@/cms/client/api';
import { useOpacaApi } from './use-opaca-api';

// Se você tiver um hook de API tipo useHcmsApi, injeta aqui
// import { useHcmsApi } from '@/cms/client/api'

type UseOpacaResult =
  | { loading: true; data: null }
  | {
      loading: false;
      data: TOpacaState;
      slug: string | null;
      isEditing: boolean;
      itemId: string | null;
      // collection = config.collections.find(...)
      collection: TOpacaState['collections'][number] | null;
      // collectionsList = lista completa
      collectionsList: TOpacaState['collections'];
      query?: ReturnType<typeof useHcmsApi>;
    };

export function useOpaca() {
  const state = useStore($opaca);
  const { collection, action } = useParams<{
    collection?: string;
    action?: string;
  }>();

  if (!state) {
    return { loading: true, data: null };
  }

  const slug = collection ?? null;
  const isEditing = action !== undefined && action !== 'create';
  const itemId = isEditing ? action! : null;

  const activeCollection = slug
    ? state.collections.find((c) => c.slug === slug) ?? null
    : null;

  const query = useOpacaApi({
    id: itemId ?? undefined,
  });

  return {
    loading: false,
    stats: state.config.stats,
    slug,
    isEditing,
    itemId,
    collection: activeCollection,
    collectionsList: state.collections,
    query: {
      list: query.listQuery,
      item: query.itemQuery,
      create: query.createMutation,
      update: query.updateMutation,
      delete: query.removeMutation,
    },
  };
}
