// cms/client/crud-client.ts
import type { z } from 'zod';
import { buildQuery, type ListParams } from './query';
import { TableCmsSchemaTyped } from '@/cms/builders';

type InferZ<T> = T extends z.ZodTypeAny ? z.infer<T> : never;

type InsertOf<C> = C extends { insert: infer Z } ? InferZ<Z> : never;
type UpdateOf<C> = C extends { update: infer Z } ? InferZ<Z> : never;
type SelectOf<C> =
  C extends { select: infer Z } ? InferZ<Z> :
  C extends { insert: infer ZI } ? Partial<InferZ<ZI>> & { id?: string | number } :
  unknown;

type StringKeys<T> = Extract<keyof T, string>;

export type CrudClientOpts<TCms> = {
  baseUrl: string;                // ex: '/api'
  config: TCms;                   // suas tabelas
  fetchFn?: typeof fetch;         // custom fetch (Edge/CF etc.)
  headers?: () => HeadersInit | Promise<HeadersInit>;
};

type HttpError = { status: number; error?: any; details?: any };

async function handle<T>(res: Response): Promise<T> {
  if (res.ok) return res.json() as Promise<T>;
  let payload: any = null;
  try { payload = await res.json(); } catch { /* ignore */ }
  const err: HttpError = { status: res.status, error: payload?.error, details: payload?.details };
  throw err;
}

export function createApiClient<TCms extends Record<string, TableCmsSchemaTyped<any, any>>>(
  opts: CrudClientOpts<TCms>
) {
  const f = opts.fetchFn ?? fetch;
  // ✅ nome claro, nunca reuse 'base' depois
  const apiBase = `${process.env.NEXT_PUBLIC_BASE_URL}` + (opts.baseUrl ?? '/api').replace(/\/$/, '');

  const out = {} as {
    [K in Extract<keyof TCms, string>]: {
      list: (params?: ListParams<StringKeys<SelectOf<TCms[K]>>>) => Promise<{
        data: Array<SelectOf<TCms[K]>>;
        limit: number;
        offset: number;
        orderBy?: string;
        order?: 'asc' | 'desc';
        selected?: string[];
      }>;
      get: (id: string | number, params?: { select?: StringKeys<SelectOf<TCms[K]>>[] }) => Promise<SelectOf<TCms[K]>>;
      create: (input: InsertOf<TCms[K]>) => Promise<SelectOf<TCms[K]>>;
      update: (id: string | number, input: UpdateOf<TCms[K]>) => Promise<SelectOf<TCms[K]>>;
      remove: (id: string | number) => Promise<{ ok: true; soft: boolean } | SelectOf<TCms[K]>>;
    }
  };

  const tables = Object.keys(opts.config) as Array<Extract<keyof TCms, string>>;

  for (const table of tables) {
    out[table] = {
      async list(params) {
        const qsStr = buildQuery(params).toString();
        const extraHeaders = opts.headers ? await opts.headers() : undefined;
        const hdrs = new Headers(extraHeaders);
        const url = `${apiBase}/${table}${qsStr ? `?${qsStr}` : ''}`;
        const res = await f(url, { headers: hdrs });
        return handle(res);
      },

      async get(id, params) {
        const qs = new URLSearchParams();
        if (params?.select?.length) qs.set('select', params.select.join(','));
        const query = qs.toString();
        const extraHeaders = opts.headers ? await opts.headers() : undefined;
        const hdrs = new Headers(extraHeaders);
        const url = `${apiBase}/${table}/${id}${query ? `?${query}` : ''}`;
        const res = await f(url, { headers: hdrs });
        return handle(res);
      },

      async create(input) {
        const extraHeaders = opts.headers ? await opts.headers() : undefined;
        const hdrs = new Headers(extraHeaders);
        hdrs.set('content-type', 'application/json');
        const url = `${apiBase}/${table}`;
        const res = await f(url, {
          method: 'POST',
          headers: hdrs,
          body: JSON.stringify(input),
        });
        return handle(res);
      },

      async update(id, input) {
        const extraHeaders = opts.headers ? await opts.headers() : undefined;
        const hdrs: HeadersInit = {
          'content-type': 'application/json',
          ...(extraHeaders ?? {}),
        };
        const url = `${apiBase}/${table}/${id}`;
        const res = await f(url, {
          method: 'PATCH',
          headers: hdrs,
          body: JSON.stringify(input),
        });
        return handle(res);
      },

      async remove(id) {
        const extraHeaders = opts.headers ? await opts.headers() : undefined;
        const hdrs = new Headers(extraHeaders);
        const url = `${apiBase}/${table}/${id}`;
        const res = await f(url, { method: 'DELETE', headers: hdrs });
        return handle(res);
      },
    };
  }

  return out;
}
