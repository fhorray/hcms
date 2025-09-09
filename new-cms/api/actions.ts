'use server'

import { cookies, headers as nextHeaders } from 'next/headers'

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
  | undefined

const DEFAULT_BASE =
  process.env.OPACA_BASE_URL ??
  process.env.NEXT_PUBLIC_OPACA_API ??
  '/api'

function buildQS(query: Query): string {
  if (!query) return ''
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue
    if (Array.isArray(v)) {
      for (const it of v) {
        if (it === undefined || it === null) continue
        sp.append(k, String(it))
      }
    } else {
      sp.append(k, String(v))
    }
  }
  const s = sp.toString()
  return s ? `?${s}` : ''
}

function urlJoin(...parts: Array<string | number>): string {
  return parts
    .map(String)
    .map((p) => p.replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/')
}

function makeUrl(baseUrl: string, table: string, id?: string | number, query?: Query) {
  const path = id !== undefined ? urlJoin(baseUrl, table, id) : urlJoin(baseUrl, table)
  return `${path}${buildQS(query)}`
}

async function makeHeaders(extra?: HeadersInit): Promise<HeadersInit> {
  const h = new Headers({ 'Content-Type': 'application/json' })
  // forward Authorization
  const auth = (await nextHeaders()).get('authorization')
  if (auth) h.set('authorization', auth)
  // forward cookies (útil se a API valida sessão por cookie)
  const cookieStr = (await cookies()).getAll().map((c) => `${c.name}=${c.value}`).join('; ')
  if (cookieStr) h.set('cookie', cookieStr)
  // merge extra
  if (extra) {
    const e = new Headers(extra)
    e.forEach((v, k) => h.set(k, v))
  }
  return h
}

async function handleJSON<T>(res: Response): Promise<T> {
  const text = await res.text()
  try {
    const json = text ? JSON.parse(text) : undefined
    if (!res.ok) {
      const message = (json && (json.message || json.error)) || text || res.statusText
      throw new Error(`${res.status} ${res.statusText} - ${message}`)
    }
    return json as T
  } catch (e) {
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    // ok mas sem JSON
    return undefined as unknown as T
  }
}

/** LIST: GET /:table?query */
export async function listAction<TData = unknown>(
  table: string,
  query?: Query,
  opts?: { baseUrl?: string },
): Promise<TData> {
  const base = opts?.baseUrl ?? DEFAULT_BASE
  const url = makeUrl(base, table, undefined, query)
  const res = await fetch(url, {
    method: 'GET',
    headers: await makeHeaders(),
    cache: 'no-store',
  })
  return handleJSON<TData>(res)
}

/** GET ONE: GET /:table/:id?query */
export async function getAction<TData = unknown>(
  table: string,
  id: string | number,
  query?: Query,
  opts?: { baseUrl?: string },
): Promise<TData> {
  const base = opts?.baseUrl ?? DEFAULT_BASE
  const url = makeUrl(base, table, id, query)
  const res = await fetch(url, {
    method: 'GET',
    headers: await makeHeaders(),
    cache: 'no-store',
  })
  return handleJSON<TData>(res)
}

/** CREATE: POST /:table */
export async function createAction<TBody extends object, TData = unknown>(
  table: string,
  body: TBody,
  opts?: { baseUrl?: string },
): Promise<TData> {
  const base = opts?.baseUrl ?? DEFAULT_BASE
  const url = makeUrl(base, table)
  const res = await fetch(url, {
    method: 'POST',
    headers: await makeHeaders(),
    body: JSON.stringify(body),
  })
  return handleJSON<TData>(res)
}

/** UPDATE: PUT /:table/:id  (troque para PATCH se preferir) */
export async function updateAction<TBody extends object, TData = unknown>(
  table: string,
  id: string | number,
  body: TBody,
  opts?: { baseUrl?: string; method?: 'PUT' | 'PATCH' },
): Promise<TData> {
  const base = opts?.baseUrl ?? DEFAULT_BASE
  const method = opts?.method ?? 'PUT'
  const url = makeUrl(base, table, id)
  const res = await fetch(url, {
    method,
    headers: await makeHeaders(),
    body: JSON.stringify(body),
  })
  return handleJSON<TData>(res)
}

/** DELETE: DELETE /:table/:id */
export async function removeAction<TData = unknown>(
  table: string,
  id: string | number,
  opts?: { baseUrl?: string },
): Promise<TData> {
  const base = opts?.baseUrl ?? DEFAULT_BASE
  const url = makeUrl(base, table, id)
  const res = await fetch(url, {
    method: 'DELETE',
    headers: await makeHeaders(),
  })
  return handleJSON<TData>(res)
}
