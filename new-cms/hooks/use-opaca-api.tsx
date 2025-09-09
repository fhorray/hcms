// new-cms/hooks/use-opaca-api.ts
'use client';

import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';

type Query =
  | Record<
      string,
      | string
      | number
      | boolean
      | null
      | undefined
      | Array<string | number | boolean | null | undefined>
    >
  | undefined;

type FetchOpts = {
  baseUrl?: string;
  headers?: HeadersInit;
};

const DEFAULT_BASE =
  process.env.NEXT_PUBLIC_OPACA_API ?? process.env.OPACA_BASE_URL ?? '/api';

// helpers ----------------------------------------------------

function buildQS(query: Query): string {
  if (!query) return '';
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v == null) continue;
    if (Array.isArray(v)) {
      for (const it of v) {
        if (it != null) sp.append(k, String(it));
      }
    } else {
      sp.append(k, String(v));
    }
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

function joinUrl(...parts: Array<string | number>) {
  return parts
    .map(String)
    .map((p) => p.replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/');
}

async function handleJSON<T>(res: Response): Promise<T> {
  const text = await res.text();
  let json: any = undefined;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const message =
      (json && (json.message || json.error)) || text || res.statusText;
    throw new Error(`${res.status} ${res.statusText} - ${message}`);
  }
  return json as T;
}

// query keys -------------------------------------------------

const qk = {
  base: (collection: string) => ['opaca', collection] as const,
  list: (collection: string, params?: Query) =>
    [...qk.base(collection), 'list', params ?? {}] as const,
  item: (collection: string, id: string | number) =>
    [...qk.base(collection), 'item', String(id)] as const,
};

// hook -------------------------------------------------------

export function useOpacaApi<
  TList = any,
  TItem = any,
  TCreate = any,
  TUpdate = any,
>(opts?: {
  /** id do item (se não passar, tenta pegar de /:collection/:action quando action !== "create") */
  id?: string | number;
  /** query params da listagem (ex: page, limit, filtros...) */
  listParams?: Query;
  /** override do baseUrl da API */
  baseUrl?: string;
  /** opções extras do React Query para a lista */
  listOptions?: UseQueryOptions<TList, Error>;
  /** opções extras do React Query para o item */
  itemOptions?: UseQueryOptions<TItem, Error>;
}) {
  const params = useParams<{ collection?: string; action?: string }>();
  const collection = params?.collection;
  const derivedId =
    opts?.id ??
    (params?.action && params.action !== 'create' ? params.action : undefined);

  const baseUrl = opts?.baseUrl ?? DEFAULT_BASE;
  const queryClient = useQueryClient();

  // urls
  const listUrl = useMemo(() => {
    if (!collection) return null;
    const path = joinUrl(baseUrl, collection);
    return `${path}${buildQS(opts?.listParams)}`;
  }, [baseUrl, collection, opts?.listParams]);

  const itemUrl = useMemo(() => {
    if (!collection || derivedId == null) return null;
    const path = joinUrl(baseUrl, collection, derivedId);
    return path;
  }, [baseUrl, collection, derivedId]);

  // QUERIES --------------------------------------------------

  const listQuery = useQuery<TList, Error>({
    queryKey: collection
      ? qk.list(collection, opts?.listParams)
      : (['opaca', 'noop'] as const),
    queryFn: async () => {
      if (!listUrl) throw new Error('Collection inválida');
      const res = await fetch(listUrl, { method: 'GET', cache: 'no-store' });
      return handleJSON<TList>(res);
    },
    enabled: Boolean(collection),
    staleTime: 0,
    ...opts?.listOptions,
  });

  const itemQuery = useQuery<TItem, Error>({
    queryKey:
      collection && derivedId != null
        ? qk.item(collection, derivedId)
        : (['opaca', 'noop'] as const),
    queryFn: async () => {
      if (!itemUrl) throw new Error('Item/collection inválidos');
      const res = await fetch(itemUrl, { method: 'GET', cache: 'no-store' });
      return handleJSON<TItem>(res);
    },
    enabled: Boolean(collection && derivedId != null),
    staleTime: 0,
    ...opts?.itemOptions,
  });

  // MUTATIONS ------------------------------------------------

  const createMutation = useMutation({
    mutationFn: async (body: TCreate) => {
      if (!collection) throw new Error('Collection inválida');
      const url = joinUrl(baseUrl, collection);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return handleJSON<TItem>(res);
    },
    onSuccess: async () => {
      if (collection) {
        await queryClient.invalidateQueries({ queryKey: qk.base(collection) });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: string | number; body: TUpdate }) => {
      if (!collection) throw new Error('Collection inválida');
      const url = joinUrl(baseUrl, collection, payload.id);
      const res = await fetch(url, {
        method: 'PUT', // troque para PATCH se sua API usar PATCH
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload.body),
      });
      return handleJSON<TItem>(res);
    },
    onSuccess: async (_data, vars) => {
      if (collection) {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: qk.list(collection, opts?.listParams),
          }),
          queryClient.invalidateQueries({
            queryKey: qk.item(collection, vars.id),
          }),
        ]);
      }
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string | number) => {
      if (!collection) throw new Error('Collection inválida');
      const url = joinUrl(baseUrl, collection, id);
      const res = await fetch(url, { method: 'DELETE' });
      // algumas APIs retornam 204 sem body:
      if (res.status === 204) return undefined as unknown as TItem;
      return handleJSON<TItem>(res);
    },
    onSuccess: async () => {
      if (collection) {
        await queryClient.invalidateQueries({
          queryKey: qk.list(collection, opts?.listParams),
        });
      }
    },
  });

  // helpers práticos ----------------------------------------

  const isEditing = Boolean(derivedId != null);

  return {
    // contexto
    collection: collection ?? null,
    isEditing,
    itemId: derivedId ?? null,

    // queries
    listQuery,
    itemQuery,

    // mutações + aliases
    create: createMutation.mutateAsync,
    update: (id: string | number, body: TUpdate) =>
      updateMutation.mutateAsync({ id, body }),
    remove: removeMutation.mutateAsync,

    // mutações cruas (se precisar de estados)
    createMutation,
    updateMutation,
    removeMutation,

    // util
    invalidateAll: async () => {
      if (collection)
        await queryClient.invalidateQueries({ queryKey: qk.base(collection) });
    },
  };
}
