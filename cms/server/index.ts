import * as schema from "@/cms/server/db/schema";
import collections from "@/collections";
import { Hono } from "hono";
import { auth } from "../auth";
import { getDb } from "./db";

// Drizzle helpers (dialect-agnostic where possible)
import {
  and, or, eq, ne, gt, gte, lt, lte, like, inArray, sql, asc, desc, isNull, ilike
} from "drizzle-orm";
// `ilike` is Postgres-only. We'll call it conditionally.


type Bindings = {};
const api = new Hono<{ Bindings: Bindings }>().basePath("/api");

const DIALECT = (process.env.OPACA_DB_DIALECT || "").toLowerCase(); // "d1" | "sqlite" | "pg"

// ---------- Small runtime helpers ----------
const isD1 = DIALECT === "d1" || DIALECT === "sqlite";
const isPg = DIALECT === "pg";

// Unified `.all()` / promise runner
async function runAll<T>(qb: any): Promise<T[]> {
  return isD1 ? (await qb.all()) : (await qb);
}

// Unified `.get()` / promise-1 runner
async function runGet<T>(qb: any): Promise<T | undefined> {
  if (isD1) return await qb.get();
  const rows: T[] = await qb.limit(1);
  return rows[0];
}

function isObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function omit<T extends object>(obj: T, keys: string[]): Partial<T> {
  const out: Partial<T> = { ...obj };
  for (const k of keys) delete (out as any)[k];
  return out;
}

function coerceScalar(v: unknown) {
  // Try boolean
  if (v === "true") return true;
  if (v === "false") return false;
  // Try number (int or float)
  if (typeof v === "string" && v.trim() !== "" && !isNaN(Number(v))) return Number(v);
  return v;
}

function isTimestampKey(k: string) {
  return /(At|_at|Date|_date|Expires|_expires)$/i.test(k);
}

function isBooleanishKey(k: string) {
  return /(^(is|has)[A-Z_]|enabled|active|banned|verified|emailVerified|published)$/i.test(k);
}

function coerceForInsertOrUpdate(
  payload: Record<string, unknown>,
  table: any,
  opts: { dropNullTimestamps?: boolean } = { dropNullTimestamps: true }
) {
  const out: Record<string, unknown> = {};
  const cols = (table as any)?.columns ? new Set(Object.keys((table as any).columns)) : undefined;

  for (const [k, v0] of Object.entries(payload)) {
    if (cols && !cols.has(k)) continue;

    let v = v0;

    // Booleans: accept "true"/"false"/"1"/"0"
    if (isBooleanishKey(k) && typeof v === "string") {
      const s = v.toLowerCase().trim();
      if (s === "true" || s === "1") v = true;
      else if (s === "false" || s === "0") v = false;
    }

    // Timestamps: convert number/ISO string -> Date; drop null to allow defaultNow()
    if (isTimestampKey(k)) {
      if (v === null && opts.dropNullTimestamps) {
        continue; // let DB default handle it
      }
      if (typeof v === "number") {
        v = new Date(v);
      } else if (typeof v === "string" && v.trim()) {
        const d = new Date(v);
        if (!isNaN(d.getTime())) v = d;
      }
    }

    out[k] = v;
  }
  return out;
}

function stringifyObjectsIfD1<T extends Record<string, unknown>>(payload: T): T {
  // Only stringify plain objects/arrays for D1 TEXT columns; NEVER stringify Date.
  if (!isD1) return payload;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (v instanceof Date) {
      out[k] = v; // keep Date as Date for timestamp columns
    } else if (v !== null && typeof v === "object") {
      out[k] = JSON.stringify(v); // objects/arrays -> TEXT(JSON)
    } else {
      out[k] = v;
    }
  }
  return out as T;
}

function dropUndefined<T extends object>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) (out as any)[k] = v;
  return out;
}

function pick<T extends object>(obj: T, keys: string[]): Partial<T> {
  const out: Partial<T> = {};
  for (const k of keys) if (k in obj) (out as any)[k] = (obj as any)[k];
  return out;
}

function sanitizeUpdatePayload<T extends Record<string, unknown>>(payload: T, table: any): Partial<T> {
  // Drop immutable/auto columns to avoid NOT NULL / PK issues
  const IMMUTABLE = new Set(["id", "createdAt", "created_at", "_id"]);
  const AUTO = new Set(["updatedAt", "updated_at"]);

  const cols = (table as any)?.columns ? Object.keys((table as any).columns) : Object.keys(payload);
  const known: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload ?? {})) {
    if (!cols.includes(k)) continue;
    if (IMMUTABLE.has(k) || AUTO.has(k)) continue;
    if (v === undefined) continue;
    known[k] = v;
  }
  return known as Partial<T>;
}


// ---------- Query parsing (filters/sorts/pagination) ----------
type SortSpec = { column: string; dir: "asc" | "desc" };

function parsePagination(q: URLSearchParams) {
  // Accept page/pageSize OR limit/offset
  const pageSize = Math.min(Math.max(Number(q.get("pageSize") || "0") || 0, 1), 100);
  const page = Math.max(Number(q.get("page") || "1") || 1, 1);

  let limit = Number(q.get("limit") || "0") || 0;
  let offset = Number(q.get("offset") || "0") || 0;

  if (pageSize) {
    limit = pageSize;
    offset = (page - 1) * pageSize;
  } else if (!limit) {
    limit = 50;
    offset = 0;
  }

  return { limit, offset, page: pageSize ? page : 1, pageSize: limit };
}

function parseSort(q: URLSearchParams, table: any): SortSpec[] {
  const raw = q.get("sort");
  if (!raw) return [];
  const cols = table?.columns ? new Set(Object.keys(table.columns)) : undefined;

  return raw
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => {
      // "+name" | "-createdAt" | "name:asc" | "createdAt:desc"
      let column = token, dir: "asc" | "desc" = "asc";
      if (token.startsWith("+")) column = token.slice(1);
      else if (token.startsWith("-")) { column = token.slice(1); dir = "desc"; }
      else if (token.includes(":")) {
        const [c, d] = token.split(":");
        column = c;
        dir = (d?.toLowerCase() === "desc" ? "desc" : "asc");
      }
      if (cols && !cols.has(column)) return null;
      return { column, dir } as SortSpec;
    })
    .filter(Boolean) as SortSpec[];
}

type FilterOp = "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "like" | "ilike" | "in" | "isnull";
const OPS: FilterOp[] = ["eq", "ne", "gt", "gte", "lt", "lte", "like", "ilike", "in", "isnull"];

// Accept styles:
//   field=value                -> eq
//   field__op=value            -> with op (eq|ne|gt|...)
//   multiple allowed
function buildWhere(table: any, q: URLSearchParams) {
  const cols: Record<string, any> = table?.columns ?? {};
  const colNames = new Set(Object.keys(cols));
  const allEntries = Array.from(q.entries());

  const clauses: any[] = [];

  for (const [rawKey, rawVal] of allEntries) {
    if (["q", "limit", "offset", "page", "pageSize", "sort"].includes(rawKey)) continue;

    // Match field or field__op
    const [field, opRaw] = rawKey.split("__");
    if (!colNames.has(field)) continue;

    const column = (cols as any)[field];
    const op = (opRaw as FilterOp) || "eq";
    if (!OPS.includes(op)) continue;

    if (op === "isnull") {
      // value ignored except explicit "false" meaning NOT NULL
      const wantNull = rawVal !== "false";
      clauses.push(wantNull ? isNull(column) : ne(column, null));
      continue;
    }

    if (op === "in") {
      const list = rawVal.split(",").map((s) => coerceScalar(s.trim()));
      clauses.push(inArray(column, list));
      continue;
    }

    if (op === "like") {
      clauses.push(like(column, `%${String(rawVal)}%`));
      continue;
    }

    if (op === "ilike") {
      if (isPg) clauses.push((ilike as any)(column, `%${String(rawVal)}%`));
      else clauses.push(like(column, `%${String(rawVal)}%`)); // SQLite LIKE is case-insensitive for ASCII
      continue;
    }

    // Comparison / equality
    const val = coerceScalar(rawVal);
    switch (op) {
      case "eq": clauses.push(eq(column, val as any)); break;
      case "ne": clauses.push(ne(column, val as any)); break;
      case "gt": clauses.push(gt(column, val as any)); break;
      case "gte": clauses.push(gte(column, val as any)); break;
      case "lt": clauses.push(lt(column, val as any)); break;
      case "lte": clauses.push(lte(column, val as any)); break;
    }
  }

  // Quick text search: q=term (applies OR across textual-looking columns)
  const quick = q.get("q");
  if (quick && quick.trim()) {
    const term = `%${quick.trim()}%`;
    const textCols = Object.keys(cols).filter((k) => {
      // Heuristic: treat columns with typical names as text
      return /name|title|email|slug|description|text|body|image|role/i.test(k);
    });
    const orParts = textCols.map((k) => like((cols as any)[k], term));
    if (orParts.length) clauses.push(or(...orParts));
  }

  if (!clauses.length) return undefined;
  return and(...clauses);
}

// ---------- Unified list (with filters, sort, pagination) ----------
async function listWithQuery(c: any, table: any) {
  const db = await getDb();
  const q = new URL(c.req.url).searchParams;

  const whereExpr = buildWhere(table, q);
  const sorts = parseSort(q, table);
  const { limit, offset, page, pageSize } = parsePagination(q);

  let qb = (db as any).select().from(table);
  if (whereExpr) qb = qb.where(whereExpr);
  if (sorts.length) {
    qb = qb.orderBy(...sorts.map((s) => (s.dir === "desc" ? desc((table as any).columns[s.column]) : asc((table as any).columns[s.column]))));
  }
  qb = qb.limit(limit).offset(offset);

  const data = await runAll<any>(qb);

  // Total count (simple & robust)
  // Using COUNT(*) with same where.
  let total = 0;
  if (whereExpr) {
    const countQ = (db as any).select({ count: sql<number>`count(1)` }).from(table).where(whereExpr);
    const row = await runGet<{ count: number }>(countQ);
    total = Number(row?.count ?? 0);
  } else {
    const countQ = (db as any).select({ count: sql<number>`count(1)` }).from(table);
    const row = await runGet<{ count: number }>(countQ);
    total = Number(row?.count ?? 0);
  }

  return c.json({ data, page, pageSize, total });
}

// ---------- Base routes ----------
api.get("/", (c) => c.json({ status: "ok", message: "Welcome to Opaca CMS API" }));
api.on(["POST", "GET"], "/auth/**", (c) => auth.handler(c.req.raw));

api.get("/_schema/:resource", (c) => {
  const name = c.req.param("resource");
  if (!(schema as any)[name]) return c.json({ error: "Not found" }, 404);
  const data = Object.values(collections).find((f: any) => f.name.toLowerCase() === name.toLowerCase());
  return c.json({ ...data });
});

// ---------- CRUD per table ----------
for (const [key, table] of Object.entries(schema)) {
  // LIST with filters/sort/pagination
  api.get(`/${key}`, async (c) => {
    try {
      return await listWithQuery(c, table);
    } catch (err: any) {
      return c.json({ error: "Failed to list", detail: String(err?.message || err) }, 500);
    }
  });

  // CREATE
  api.post(`/${key}`, async (c) => {
    try {
      const db = await getDb();
      const raw = await c.req.json();

      // Use Drizzle's real column names
      const cols = (table as any)?.columns
        ? Object.keys((table as any).columns)
        : Object.keys(raw ?? {});

      // Clean + type coercion
      const clean = dropUndefined(pick(raw || {}, cols));
      const typed = coerceForInsertOrUpdate(clean, table, { dropNullTimestamps: true });

      // For D1/sqlite TEXT JSON fields, stringify; keep Date objects intact
      const payload = stringifyObjectsIfD1(typed);

      if (isD1) {
        await (db as any).insert(table).values(payload);
        return c.json({ ok: true });
      } else {
        const inserted = await (db as any).insert(table).values(payload).returning();
        return c.json(inserted, 201);
      }
    } catch (err: any) {
      return c.json({ error: "Failed to create", detail: String(err?.message || err) }, 500);
    }
  });

  // READ ONE
  api.get(`/${key}/:id`, async (c) => {
    try {
      const db = await getDb();
      const id = c.req.param("id");
      const rows = await runAll<any>((db as any).select().from(table).where(eq((table as any).id, id)).limit(1));
      const row = rows[0] ?? null;
      if (!row) return c.json({ error: "Not found" }, 404);
      return c.json(row);
    } catch (err: any) {
      return c.json({ error: "Failed to get item", detail: String(err?.message || err) }, 500);
    }
  });

  // UPDATE
  api.put(`/${key}/:id`, async (c) => {
    try {
      const db = await getDb();
      const id = c.req.param("id");
      const raw = await c.req.json();

      // Sanitize: keep only mutable known columns
      const data = sanitizeUpdatePayload(raw || {}, table);
      if (Object.keys(data).length === 0) {
        return c.json({ ok: true, changed: 0 });
      }

      // Coerce types (booleans/timestamps -> Date)
      const typed = coerceForInsertOrUpdate(data, table, { dropNullTimestamps: true });

      // Stringify JSON-like values for D1 TEXT JSON, but keep Date intact
      const payload = stringifyObjectsIfD1(typed);

      if (isD1) {
        await (db as any).update(table).set(payload).where(eq((table as any).id, id));
        return c.json({ ok: true });
      } else {
        const updated = await (db as any)
          .update(table)
          .set(payload)
          .where(eq((table as any).id, id))
          .returning();
        const row = updated?.[0] ?? null;
        if (!row) return c.json({ error: "Not found" }, 404);
        return c.json(row);
      }
    } catch (err: any) {
      return c.json({ error: "Failed to update", detail: String(err?.message || err) }, 500);
    }
  });

  // DELETE
  api.delete(`/${key}/:id`, async (c) => {
    try {
      const db = await getDb();
      const id = c.req.param("id");
      if (isD1) {
        await (db as any).delete(table).where(eq((table as any).id, id));
        return c.json({ ok: true });
      } else {
        const deleted = await (db as any).delete(table).where(eq((table as any).id, id)).returning();
        const row = deleted?.[0] ?? null;
        if (!row) return c.json({ error: "Not found" }, 404);
        return c.json(row);
      }
    } catch (err: any) {
      return c.json({ error: "Failed to delete", detail: String(err?.message || err) }, 500);
    }
  });
}

export default api;
