'use client';

import { useQuery, useMutation, useQueryClient, QueryKey } from '@tanstack/react-query';

// ==============================
// Tipos base
// ==============================

type Id = string | number;

type FetcherOptions = {
  baseUrl?: string;                     // default: '/api'
  headers?: Record<string, string>;     // ex.: Authorization, x-tenant-id
};

export type Order = 'asc' | 'desc';

export type ListResponse<T> = {
  data: T[];
  limit: number;
  offset: number;
  order?: Order;
  orderBy?: string;
  selected?: string[];
};

type Primitive = string | number | boolean | null;

// ==============================
// Query Builder para o CRUD
// ==============================

type Op = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'like';

export type Where = Record<
  string,
  | Primitive
  | { [K in Op]?: Primitive | Primitive[] }
>;

export type OrGroup = {
  where?: Where;
};

export type ListParams = {
  limit?: number;
  offset?: number;
  orderBy?: string;
  order?: Order;
  select?: string[];      // projeção
  where?: Where;          // AND (implícito)
  or?: OrGroup[];         // grupos OR: (g0) OR (g1) ...
};

// serialização estável para ir no queryKey do React Query
const stable = (v: unknown) =>
  JSON.stringify(v, Object.keys(v as any).sort());

// Constrói URLSearchParams no formato aceito pelo router
export function buildSearchParams(p?: ListParams): URLSearchParams {
  const q = new URLSearchParams();
  if (!p) return q;

  if (p.limit != null) q.set('limit', String(p.limit));
  if (p.offset != null) q.set('offset', String(p.offset));
  if (p.orderBy) q.set('orderBy', p.orderBy);
  if (p.order) q.set('order', p.order);
  if (p.select?.length) q.set('select', p.select.join(','));

  // where AND
  if (p.where) {
    for (const [col, val] of Object.entries(p.where)) {
      if (val == null) continue;
      if (typeof val === 'object' && !Array.isArray(val)) {
        const ops = val as Record<Op, any>;
        for (const [op, v] of Object.entries(ops)) {
          if (v == null) continue;
          if (op === 'in') {
            const arr = Array.isArray(v) ? v : [v];
            q.set(`where.${col}[in]`, arr.join(','));
          } else {
            q.set(`where.${col}[${op}]`, String(v));
          }
        }
      } else {
        q.set(`where.${col}`, String(val)); // atalho para eq
      }
    }
  }

  // OR groups
  if (p.or?.length) {
    p.or.forEach((group, i) => {
      if (!group.where) return;
      for (const [col, val] of Object.entries(group.where)) {
        if (val == null) continue;
        if (typeof val === 'object' && !Array.isArray(val)) {
          const ops = val as Record<Op, any>;
          for (const [op, v] of Object.entries(ops)) {
            if (v == null) continue;
            if (op === 'in') {
              const arr = Array.isArray(v) ? v : [v];
              q.set(`or.${i}.where.${col}[in]`, arr.join(','));
            } else {
              q.set(`or.${i}.where.${col}[${op}]`, String(v));
            }
          }
        } else {
          q.set(`or.${i}.where.${col}`, String(val));
        }
      }
    });
  }

  return q;
}

// Helpers “fluentes” para montar ListParams
export const Q = {
  paginate: (limit = 20, offset = 0): ListParams => ({ limit, offset }),
  order: (orderBy: string, order: Order = 'desc'): ListParams => ({ orderBy, order }),
  select: (...cols: string[]): ListParams => ({ select: cols }),
  where: (w: Where): ListParams => ({ where: w }),
  or: (...groups: OrGroup[]): ListParams => ({ or: groups }),
  // merge seguro
  merge: (...parts: (ListParams | undefined)[]): ListParams =>
    parts.reduce<ListParams>((acc, cur) => {
      if (!cur) return acc;
      return {
        ...acc,
        ...cur,
        // concat de select
        select: cur.select ? Array.from(new Set([...(acc.select ?? []), ...cur.select])) : acc.select,
        // merge profundo de where
        where: cur.where ? { ...(acc.where ?? {}), ...cur.where } : acc.where,
        // concat de or
        or: cur.or ? [...(acc.or ?? []), ...cur.or] : acc.or,
      };
    }, {}),
};

// ==============================
// Fetcher + erros ricos
// ==============================

const toQueryString = (q: URLSearchParams) => (q.toString() ? `?${q.toString()}` : '');

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
    // LIST agora retorna { data, limit, offset, ... }
    list: <T>(table: string, params?: ListParams) => {
      const q = buildSearchParams(params);
      return json(`/${table}${toQueryString(q)}`) as Promise<ListResponse<T>>;
    },
    get: <T>(table: string, id: Id, select?: string[]) => {
      const q = new URLSearchParams();
      if (select?.length) q.set('select', select.join(','));
      return json(`/${table}/${id}${toQueryString(q)}`) as Promise<T>;
    },
    create: <In, Out>(table: string, data: In) =>
      json(`/${table}`, { method: 'POST', body: JSON.stringify(data) }) as Promise<Out>,
    // UPDATE agora usa PATCH (parcial)
    update: <In, Out>(table: string, id: Id, data: In) =>
      json(`/${table}/${id}`, { method: 'PATCH', body: JSON.stringify(data) }) as Promise<Out>,
    // DELETE pode ser soft (servidor decide)
    remove: <Out = { ok: boolean; soft?: boolean }>(table: string, id: Id) =>
      json(`/${table}/${id}`, { method: 'DELETE' }) as Promise<Out>,
    baseUrl,
  };
}

// ==============================
// Query Keys canônicas (com params estáveis)
// ==============================

export const keys = {
  all: ['tables'] as const,
  byTable: (t: string) => [...keys.all, t] as const,
  list: (t: string, params?: ListParams) =>
    [...keys.byTable(t), 'list', stable(params ?? {})] as const,
  item: (t: string, id: Id, select?: string[]) =>
    [...keys.byTable(t), 'item', String(id), stable(select ?? [])] as const,
};

// ==============================
// Hooks CRUD genéricos
// ==============================

export function createCrudHooks(fetchOpts?: FetcherOptions) {
  const api = makeFetcher(fetchOpts);

  const useList = <T = any>(table: string, params?: ListParams) =>
    useQuery<ListResponse<T>>({
      queryKey: keys.list(table, params),
      queryFn: () => api.list<T>(table, params),
    });

  const useItem = <T = any>(table: string, id: Id, opts?: { enabled?: boolean; select?: string[] }) =>
    useQuery<T>({
      queryKey: keys.item(table, id, opts?.select),
      queryFn: () => api.get<T>(table, id, opts?.select),
      enabled: opts?.enabled ?? true,
    });

  const useCreate = <In = any, Out = any>(table: string) => {
    const qc = useQueryClient();
    return useMutation<Out, Error, In>({
      mutationFn: (data) => api.create<In, Out>(table, data),
      onSuccess: () => {
        // invalida todas as listas/itens daquela tabela
        qc.invalidateQueries({ queryKey: keys.byTable(table) as unknown as QueryKey });
      },
    });
  };

  const useUpdate = <In extends object = any, Out extends object = any>(table: string) => {
    const qc = useQueryClient();
    return useMutation<Out, Error, { id: Id; data: In }, { prev?: Out; id: Id }>({
      mutationFn: ({ id, data }) => api.update<In, Out>(table, id, data),
      onMutate: async ({ id, data }) => {
        // cancel item e listas
        await Promise.all([
          qc.cancelQueries({ queryKey: keys.item(table, id) }),
          qc.cancelQueries({ queryKey: keys.byTable(table) }),
        ]);
        const prev = qc.getQueryData<Out>(keys.item(table, id));
        // Otimista (merge parcial)
        if (prev) {
          qc.setQueryData<Out>(keys.item(table, id), { ...(prev as any), ...(data as any) });
        }
        return { prev, id };
      },
      onError: (_err, _vars, ctx) => {
        if (ctx?.prev) qc.setQueryData(keys.item(table, ctx.id), ctx.prev);
      },
      onSuccess: (updated, { id }) => {
        // atualiza item e invalida listas (respeitando params diferentes)
        qc.setQueryData(keys.item(table, id), updated);
        qc.invalidateQueries({ queryKey: keys.byTable(table) });
      },
    });
  };

  const useRemove = <Out extends { ok: boolean; soft?: boolean } = { ok: boolean; soft?: boolean }>(table: string) => {
    const qc = useQueryClient();
    return useMutation<Out, Error, Id>({
      mutationFn: (id) => api.remove<Out>(table, id),
      onSuccess: (_res, id) => {
        // remove cache do item e invalida listas
        qc.removeQueries({ queryKey: keys.item(table, id) });
        qc.invalidateQueries({ queryKey: keys.byTable(table) });
      },
    });
  };

  return { api, useList, useItem, useCreate, useUpdate, useRemove };
}

// ==============================
// Exemplo de uso (adapte ao seu projeto)
// ==============================

// Se você usa header de tenant/token:
export const crud = createCrudHooks({
  baseUrl: '/api',
  headers: {
    // 'Authorization': `Bearer ${token}`,
    // 'x-tenant-id': tenantId,
  },
});

/**
 * Exemplos:
 *
 * // listar com projeção + filtros avançados
 * const { data } = crud.useList<Product>('products', Q.merge(
 *   Q.select('id', 'title', 'price'),
 *   Q.where({ inStock: { eq: true }, price: { gte: 50 } }),
 *   Q.or({ where: { status: { in: ['draft', 'published'] } } }),
 *   Q.order('createdAt', 'desc'),
 *   Q.paginate(20, 0),
 * ));
 *
 * // item com projeção
 * const { data: product } = crud.useItem<Product>('products', 123, { select: ['id','title','tags'] });
 *
 * // create
 * const createProduct = crud.useCreate<ProductInput, Product>('products');
 * createProduct.mutate({ title: 'Camisa', price: 99.9, inStock: true });
 *
 * // update parcial (PATCH)
 * const updateProduct = crud.useUpdate<Partial<ProductInput>, Product>('products');
 * updateProduct.mutate({ id: 123, data: { price: 109.9 } });
 *
 * // delete (pode ser soft no servidor)
 * const removeProduct = crud.useRemove('products');
 * removeProduct.mutate(123);
 */