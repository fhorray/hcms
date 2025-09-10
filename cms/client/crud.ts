'use client';

import { useQuery, useMutation, useQueryClient, QueryKey } from '@tanstack/react-query';

import collections from "@/collections";

// Aceita string/number porque seu backend pode usar CUID (string) ou int
type Id = string | number;

type FetcherOptions = {
  baseUrl?: string;                     // default: '/api'
  headers?: Record<string, string>;
};

const toQuery = (params?: Record<string, unknown>) => {
  if (!params || Object.keys(params).length === 0) return '';
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    q.append(k, String(v));
  }
  return `?${q.toString()}`;
};

function makeFetcher({ baseUrl = '/api', headers = {} }: FetcherOptions = {}) {
  const json = async (input: string, init?: RequestInit) => {
    const res = await fetch(`${baseUrl}${input}`, {
      ...init,
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
        ...(init?.headers || {}),
      },
    });
    if (!res.ok) {
      let body: any;
      try { body = await res.json(); } catch { body = await res.text(); }
      const err = new Error(typeof body === 'string' ? body : body?.error || 'Request failed');
      (err as any).status = res.status;
      (err as any).body = body;
      throw err;
    }
    return res.status === 204 ? null : res.json();
  };

  return {
    list: <T>(collection: string, params?: Record<string, unknown>) =>
      json(`/${collection}${toQuery(params)}`) as Promise<T[]>,
    get: <T>(collection: string, id: Id) =>
      json(`/${collection}/${id}`) as Promise<T>,
    create: <In, Out>(collection: string, data: In) =>
      json(`/${collection}`, { method: 'POST', body: JSON.stringify(data) }) as Promise<Out>,
    update: <In, Out>(collection: string, id: Id, data: In) =>
      json(`/${collection}/${id}`, { method: 'PUT', body: JSON.stringify(data) }) as Promise<Out>,
    remove: <Out>(collection: string, id: Id) =>
      json(`/${collection}/${id}`, { method: 'DELETE' }) as Promise<Out>,
    schema: (collection: string) => json(`/_schema/${collection}`) as Promise<any>,
    baseUrl,
  };
}

// Query Keys canônicas
export const keys = {
  all: ['collections'] as const,
  byCollection: (col: string) => [...keys.all, col] as const,
  list: (col: string, params?: Record<string, unknown>) =>
    [...keys.byCollection(col), 'list', params ?? {}] as const,
  item: (col: string, id: Id) =>
    [...keys.byCollection(col), 'item', String(id)] as const,
};

// Hooks CRUD genéricos (dinâmicos por nome da coleção)
export function createCrudHooks(fetchOpts?: FetcherOptions) {
  const api = makeFetcher(fetchOpts);

  const useList = <T = any>(collection: string, params?: Record<string, unknown>) =>
    useQuery<T[]>({
      queryKey: keys.list(collection, params),
      queryFn: () => api.list<T>(collection, params),
    });

  const useItem = <T = any>(collection: string, id: Id, enabled = true) =>
    useQuery<T>({
      queryKey: keys.item(collection, id),
      queryFn: () => api.get<T>(collection, id),
      enabled,
    });

  const useCreate = <In = any, Out = any>(collection: string) => {
    const qc = useQueryClient();
    return useMutation<Out, Error, In>({
      mutationFn: (data) => api.create<In, Out>(collection, data),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: keys.byCollection(collection) as unknown as QueryKey });
      },
    });
  };

  const useUpdate = <In = any, Out = any>(collection: string) => {
    const qc = useQueryClient();
    return useMutation<Out, Error, { id: Id; data: In }, { prev?: Out; id: Id }>({
      mutationFn: ({ id, data }) => api.update<In, Out>(collection, id, data),
      onMutate: async ({ id, data }) => {
        await qc.cancelQueries({ queryKey: keys.item(collection, id) });
        const prev = qc.getQueryData<Out>(keys.item(collection, id));
        // Otimista
        qc.setQueryData<Out>(keys.item(collection, id), (old) => ({ ...(old as any), ...(data as any) }));
        return { prev, id };
      },
      onError: (_err, _vars, ctx) => {
        if (ctx?.prev) qc.setQueryData(keys.item(collection, ctx.id), ctx.prev);
      },
      onSuccess: (updated, { id }) => {
        qc.setQueryData(keys.item(collection, id), updated);
        qc.invalidateQueries({ queryKey: keys.list(collection) });
      },
    });
  };

  const useRemove = <Out = any>(collection: string) => {
    const qc = useQueryClient();
    return useMutation<Out, Error, Id>({
      mutationFn: (id) => api.remove<Out>(collection, id),
      onSuccess: (_res, id) => {
        qc.removeQueries({ queryKey: keys.item(collection, id) });
        qc.invalidateQueries({ queryKey: keys.list(collection) });
      },
    });
  };

  return { api, useList, useItem, useCreate, useUpdate, useRemove };
}


// ------------------------------------------------------
// Factory tipado por coleção
// ------------------------------------------------------


const crud = createCrudHooks({ baseUrl: "/api" });

export const autoCrud = Object.fromEntries(
  Object.values(collections).map((c) => [
    c.name.toLowerCase(),
    {
      useList: (params?: Record<string, unknown>) =>
        crud.useList<any>(c.name.toLowerCase(), params),
      useItem: (id: string | number, enabled = true) =>
        crud.useItem<any>(c.name.toLowerCase(), id, enabled),
      useCreate: () => crud.useCreate<any, any>(c.name.toLowerCase()),
      useUpdate: () => crud.useUpdate<any, any>(c.name.toLowerCase()),
      useRemove: () => crud.useRemove<any>(c.name.toLowerCase()),
    },
  ])
) as Record<
  string,
  {
    useList: (params?: Record<string, unknown>) => ReturnType<typeof crud.useList<any>>;
    useItem: (id: string | number, enabled?: boolean) => ReturnType<typeof crud.useItem<any>>;
    useCreate: () => ReturnType<typeof crud.useCreate<any, any>>;
    useUpdate: () => ReturnType<typeof crud.useUpdate<any, any>>;
    useRemove: () => ReturnType<typeof crud.useRemove<any>>;
  }
>;