// cms/crud/honoCrud.ts
import { Context, Hono } from "hono";
import type { z } from "zod";
import {
  and,
  or,
  asc,
  desc,
  eq as dEq,
  ne as dNe,
  lt as dLt,
  lte as dLte,
  gt as dGt,
  gte as dGte,
  inArray,
  like as dLike,
  SQL,
  getTableName,
  type Table,
} from "drizzle-orm";
import type { TableCmsSchemaTyped, CmsFromSchema } from "../builders/drizzle";

// ---------------------------------------------
// Tipos de configuração
// ---------------------------------------------
// TODO: change it to a specific db type (drizzle, prisma etc...)
type DBType = ReturnType<typeof import("@/server/db").getDb>;

export type SerializeMode = {
  dates: "ms" | "iso" | "date";
  json: "string" | "native";
};

export type TableAcl = {
  canList?: (ctx: { c: any }) => Promise<boolean> | boolean;
  canRead?: (ctx: { c: any; id: string }) => Promise<boolean> | boolean;
  canCreate?: (ctx: { c: any; data: any }) => Promise<boolean> | boolean;
  canUpdate?: (ctx: { c: any; id: string; data: any }) => Promise<boolean> | boolean;
  canDelete?: (ctx: { c: any; id: string }) => Promise<boolean> | boolean;
};

export type TableHooks = {
  beforeCreate?: (data: any, ctx: { c: any }) => Promise<any> | any;
  afterCreate?: (row: any, ctx: { c: any }) => Promise<any> | any;
  beforeUpdate?: (data: any, ctx: { c: any; id: string }) => Promise<any> | any;
  afterUpdate?: (row: any, ctx: { c: any; id: string }) => Promise<any> | any;
  beforeDelete?: (ctx: { c: any; id: string }) => Promise<void> | void;
  afterDelete?: (ctx: { c: any; id: string }) => Promise<void> | void;
};

export type SoftDeleteConfig = {
  column: string;
  excludeByDefault?: boolean;
  valueFactory?: () => Date;
};

export type TenantConfig = {
  column: string;
  getTenantId: (c: any) => string | number | undefined | null;
  required?: boolean;
};

export type RateLimitConfig = {
  allow: (ctx: { c: any; table: string; method: string }) => Promise<boolean> | boolean;
};

export type AuditEvent =
  | { kind: "create"; table: string; id?: string | number; data: any }
  | { kind: "update"; table: string; id: string | number; data: any }
  | { kind: "delete"; table: string; id: string | number; soft: boolean }
  | { kind: "read"; table: string; id?: string | number; query?: Record<string, any> };

export type AuditLogConfig = {
  onEvent: (e: AuditEvent, ctx: { c: any }) => void | Promise<void>;
};

export type TableConfig = {
  idColumn?: string;
  readOnly?: string[];
  jsonFields?: string[];
  acl?: TableAcl;
  hooks?: TableHooks;
  softDelete?: SoftDeleteConfig | null;
  tenant?: TenantConfig | null;
};

// Deixe o CrudOptions generics para manter inferência do CMS
export type CrudOptions<TSchema extends Record<string, Table>, TCms extends CmsFromSchema<TSchema>> = {
  schema: TSchema;
  config: TCms;
  database: (ctx?: Context) => DBType;
  basePath?: string;
  serialize?: SerializeMode;
  tables?: Record<string, TableConfig>;
  maxLimit?: number;
  softDelete?: SoftDeleteConfig | null;
  tenant?: TenantConfig | null;
  rateLimit?: RateLimitConfig;
  audit?: AuditLogConfig;
};

// ---------------------------------------------
// Helpers
// ---------------------------------------------
function isTable(x: unknown): x is Table {
  try {
    return !!getTableName(x as Table);
  } catch {
    return false;
  }
}

function pickTable(schema: Record<string, Table>, tableName: string) {
  const t = Object.values(schema).find((t) => getTableName(t) === tableName);
  if (!t) throw new Error(`Tabela "${tableName}" não encontrada no schema Drizzle.`);
  return t;
}

function ensureAllowedFields(data: any, readOnly: string[] | undefined) {
  if (!readOnly?.length) return;
  for (const k of readOnly) if (k in data) delete data[k];
}

function normalizeForDb(
  data: any,
  cmsTable: TableCmsSchemaTyped<any, any>,
  tableCfg: TableConfig | undefined,
  serialize: SerializeMode
) {
  const jsonSet = new Set(tableCfg?.jsonFields ?? []);
  const out: any = { ...data };

  for (const [key, meta] of Object.entries(cmsTable.columns)) {
    const v = out[key];
    if (v == null) continue;

    if (meta.kind === "date" && v instanceof Date) {
      out[key] =
        serialize.dates === "ms" ? v.getTime() : serialize.dates === "iso" ? v.toISOString() : v;
    }
    if (meta.kind === "json" || jsonSet.has(key)) {
      if (serialize.json === "string" && typeof v !== "string") out[key] = JSON.stringify(v);
    }
  }
  return out;
}

function parseList(str?: string | null) {
  if (!str) return [];
  return str.split(",").map((s) => s.trim()).filter(Boolean);
}

function safeNumber(v: string | null | undefined, d: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function coerceId(id: string) {
  const n = Number(id);
  return Number.isFinite(n) ? (n as any) : id;
}

// ----- WHERE avançado
type Op = "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "like";

// Constrói WHERE a partir dos query params
function buildWhereSQL(
  cmsTable: TableCmsSchemaTyped<any, any>,
  table: Table,
  filters: URLSearchParams
): SQL | undefined {
  const tableCols = table as any;
  const andParts: SQL[] = [];
  const orGroups: Record<string, SQL[]> = {};

  const entries = Array.from(filters.entries());

  for (const [k, v] of entries) {
    if (!(k.startsWith("where.") || k.startsWith("or."))) continue;

    const isOr = k.startsWith("or.");
    const path = k.split(".");
    let idx = 0;
    let groupKey: string | null = null;

    if (isOr) {
      groupKey = path[1]; // "0", "1", ...
      idx = 2; // próximo é "where"
    }

    if (path[idx] !== "where") continue;
    idx++;

    const raw = path.slice(idx).join(".");
    const m = raw.match(/^(.+?)(\[(.+)\])?$/);
    if (!m) continue;

    const col = m[1];
    const op: Op = (m[3] as Op) ?? "eq";
    if (!cmsTable.columns[col]) continue;

    const colRef = tableCols[col];
    if (!colRef) continue;

    const sql = opToSql(op, colRef, v, cmsTable.columns[col].kind);
    if (!sql) continue;

    if (isOr && groupKey != null) {
      orGroups[groupKey] ||= [];
      orGroups[groupKey].push(sql);
    } else {
      andParts.push(sql);
    }
  }

  const orParts = Object.values(orGroups).map((arr) => (or as any)(...arr));
  const all = [...andParts, ...orParts];
  if (!all.length) return undefined;
  return (and as any)(...all);
}

function parsePrimitive(
  val: string,
  kind: TableCmsSchemaTyped<any, any>["columns"][string]["kind"]
) {
  if (val === "null") return null;
  if (val === "true") return true;
  if (val === "false") return false;
  if (kind === "number") {
    const n = Number(val);
    if (Number.isFinite(n)) return n;
  }
  if (kind === "date") {
    const n = Number(val);
    if (Number.isFinite(n)) return new Date(n);
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;
  }
  return val;
}

function opToSql(
  op: Op,
  colRef: any,
  rawVal: string,
  kind: TableCmsSchemaTyped<any, any>["columns"][string]["kind"]
): SQL | undefined {
  switch (op) {
    case "eq": return dEq(colRef, parsePrimitive(rawVal, kind) as any);
    case "ne": return dNe(colRef, parsePrimitive(rawVal, kind) as any);
    case "gt": return dGt(colRef, parsePrimitive(rawVal, kind) as any);
    case "gte": return dGte(colRef, parsePrimitive(rawVal, kind) as any);
    case "lt": return dLt(colRef, parsePrimitive(rawVal, kind) as any);
    case "lte": return dLte(colRef, parsePrimitive(rawVal, kind) as any);
    case "in": {
      const list = parseList(rawVal).map((v) => parsePrimitive(v, kind)) as any[];
      return list.length ? (inArray as any)(colRef, list) : undefined;
    }
    case "like":
      return dLike(colRef, `%${rawVal}%`);
    default:
      return undefined;
  }
}

// ---------------------------------------------
// Router Factory - Main Function
// ---------------------------------------------
export function createRouter<
  TSchema extends Record<string, Table>,
  TCms extends CmsFromSchema<TSchema>
>(opts: CrudOptions<TSchema, TCms>) {
  const app = new Hono();
  const base = opts.basePath ?? "";
  const maxLimit = opts.maxLimit ?? 100;
  const serialize: SerializeMode = {
    dates: opts.serialize?.dates ?? "ms",
    json: opts.serialize?.json ?? "string",
  };

  const defaultSoftDelete = opts.softDelete ?? null;
  const defaultTenant = opts.tenant ?? null;

  const tableNames = Object.values(opts.schema)
    .filter(isTable)
    .map((t) => getTableName(t))
    .filter((name) => !!opts.config[name as keyof TCms]);

  // ------------- Middlewares -------------
  async function checkRate(c: any, table: string, method: string) {
    if (opts.rateLimit?.allow) {
      const ok = await opts.rateLimit.allow({ c, table, method });
      if (!ok) return c.json({ error: "Too Many Requests" }, 429);
    }
    return null;
  }

  function audit(kind: AuditEvent["kind"], table: string, payload: any, c: any) {
    if (!opts.audit?.onEvent) return;
    return Promise.resolve(opts.audit.onEvent({ kind, table, ...payload } as any, { c }));
  }

  // ---------------- GET /:table (list) ----------------
  app.get(`${base}/:table`, async (c) => {
    const tableName = c.req.param("table");
    if (!tableNames.includes(tableName)) return c.json({ error: "Tabela inválida" }, 404);
    if (await checkRate(c, tableName, "LIST")) return;

    const db = opts.database(c);
    const table = pickTable(opts.schema, tableName);
    const cmsTable = opts.config[tableName as keyof TCms] as unknown as TableCmsSchemaTyped<any, any>;
    const cfg = opts.tables?.[tableName];

    if (cfg?.acl?.canList && !(await cfg.acl.canList({ c }))) return c.json({ error: "Forbidden" }, 403);

    // pagination, order, projection
    const q = c.req.query();
    const rawLimit = Math.min(safeNumber(q.limit, 20), maxLimit);
    const limit = rawLimit <= 0 ? 20 : rawLimit;
    const offset = safeNumber(q.offset, 0);
    const orderBy = q.orderBy && cmsTable.columns[q.orderBy] ? q.orderBy : undefined;
    const order = (q.order ?? "desc").toLowerCase() === "asc" ? "asc" : "desc";
    const selectCols = parseList(q.select).filter((col) => !!cmsTable.columns[col]);

    const searchParams = new URLSearchParams(c.req.url.split("?")[1] ?? "");
    let whereSql = buildWhereSQL(cmsTable, table, searchParams);

    // multi-tenant
    const tenantCfg = cfg?.tenant === null ? null : cfg?.tenant ?? defaultTenant;
    if (tenantCfg) {
      const tenantId = tenantCfg.getTenantId(c);
      if (tenantCfg.required !== false && (tenantId === undefined || tenantId === null || tenantId === "")) {
        return c.json({ error: "Tenant required" }, 400);
      }
      if (tenantId != null) {
        const col = (table as any)[tenantCfg.column];
        if (!col) return c.json({ error: `Tenant column "${tenantCfg.column}" não existe` }, 500);
        whereSql = whereSql ? (and as any)(whereSql, dEq(col, tenantId as any)) : dEq(col, tenantId as any);
      }
    }

    // soft delete
    const sd = cfg?.softDelete === null ? null : cfg?.softDelete ?? defaultSoftDelete;
    if (sd && (sd.excludeByDefault ?? true)) {
      const col = (table as any)[sd.column];
      if (!col) return c.json({ error: `Soft delete column "${sd.column}" não existe` }, 500);
      const clause = dEq(col, null as any);
      whereSql = whereSql ? (and as any)(whereSql, clause) : clause;
    }

    // select
    const colObj: any = table as any;
    let stmt: any;

    if (selectCols.length) {
      const projection: Record<string, any> = {};
      for (const col of selectCols) projection[col] = colObj[col];
      stmt = db.select(projection).from(table);
    } else {
      stmt = db.select().from(table);
    }

    if (whereSql) stmt = stmt.where(whereSql);
    if (orderBy) stmt = stmt.orderBy(order === "asc" ? asc(colObj[orderBy]) : desc(colObj[orderBy]));
    stmt = stmt.limit(limit).offset(offset);

    const data = await stmt.all();

    // desserializa JSON string → obj
    const parsed = data.map((r: any) => {
      const out: any = { ...r };
      for (const [k, m] of Object.entries(cmsTable.columns)) {
        if (m.kind === "json" && typeof out[k] === "string") {
          try { out[k] = JSON.parse(out[k]); } catch { }
        }
      }
      return out;
    });

    await audit(
      "read",
      tableName,
      Object.assign(
        { id: undefined },
        Object.keys(Object.fromEntries(searchParams.entries())).length > 0
          ? { query: Object.fromEntries(searchParams.entries()) }
          : {}
      ),
      c
    );
    return c.json({ data: parsed, limit, offset, orderBy, order, selected: selectCols.length ? selectCols : undefined });
  });

  // ---------------- POST /:table (create) ----------------
  app.post(`${base}/:table`, async (c) => {
    const tableName = c.req.param("table");
    if (!tableNames.includes(tableName)) return c.json({ error: "Tabela inválida" }, 404);
    if (await checkRate(c, tableName, "CREATE")) return;

    const db = opts.database(c);
    const table = pickTable(opts.schema, tableName);
    const cmsTable = opts.config[tableName as keyof TCms] as unknown as TableCmsSchemaTyped<any, any>;
    const cfg = opts.tables?.[tableName];

    let body: unknown;
    try { body = await c.req.json(); } catch { return c.json({ error: "JSON inválido" }, 400); }

    let data: any;
    try { data = (cmsTable.insert as z.ZodTypeAny).parse(body); }
    catch (err: any) { return c.json({ error: "ValidationError", details: err?.issues ?? String(err) }, 422); }

    ensureAllowedFields(data, cfg?.readOnly);

    // tenant
    const tenantCfg = cfg?.tenant === null ? null : cfg?.tenant ?? defaultTenant;
    if (tenantCfg) {
      const tenantId = tenantCfg.getTenantId(c);
      if (tenantCfg.required !== false && (tenantId === undefined || tenantId === null || tenantId === "")) {
        return c.json({ error: "Tenant required" }, 400);
      }
      if (tenantId != null && data[tenantCfg.column] == null) {
        data[tenantCfg.column] = tenantId;
      }
    }

    if (cfg?.acl?.canCreate && !(await cfg.acl.canCreate({ c, data }))) return c.json({ error: "Forbidden" }, 403);
    if (cfg?.hooks?.beforeCreate) data = await cfg.hooks.beforeCreate(data, { c });

    data = normalizeForDb(data, cmsTable, cfg, serialize);

    const inserted = await db.insert(table).values(data as any).returning().get();

    await audit("create", tableName, { data: inserted }, c);
    if (cfg?.hooks?.afterCreate) await cfg.hooks.afterCreate(inserted, { c });
    return c.json(inserted, 201);
  });

  // ---------------- GET /:table/:id (read) ----------------
  app.get(`${base}/:table/:id`, async (c) => {
    const tableName = c.req.param("table");
    const idParam = c.req.param("id");
    if (!tableNames.includes(tableName)) return c.json({ error: "Tabela inválida" }, 404);
    if (await checkRate(c, tableName, "READ")) return;

    const db = opts.database(c);
    const table = pickTable(opts.schema, tableName);
    const cmsTable = opts.config[tableName as keyof TCms] as unknown as TableCmsSchemaTyped<any, any>;
    const cfg = opts.tables?.[tableName];
    const idCol = (cfg?.idColumn ?? "id") as string;

    if (cfg?.acl?.canRead && !(await cfg.acl.canRead({ c, id: idParam }))) return c.json({ error: "Forbidden" }, 403);

    // select specific columns if needed
    const q = c.req.query();
    const selectCols = parseList(q.select).filter((col) => !!cmsTable.columns[col]);
    const colObj: any = table as any;

    const idValue = coerceId(idParam);
    let where = dEq(colObj[idCol], idValue);

    // tenant
    const tenantCfg = cfg?.tenant === null ? null : cfg?.tenant ?? defaultTenant;
    if (tenantCfg) {
      const tenantId = tenantCfg.getTenantId(c);
      if (tenantCfg.required !== false && (tenantId === undefined || tenantId === null || tenantId === "")) {
        return c.json({ error: "Tenant required" }, 400);
      }
      if (tenantId != null) {
        const tcol = colObj[tenantCfg.column];
        if (!tcol) return c.json({ error: `Tenant column "${tenantCfg.column}" não existe` }, 500);
        where = (and as any)(where, dEq(tcol, tenantId as any));
      }
    }

    // soft delete
    const sd = cfg?.softDelete === null ? null : cfg?.softDelete ?? defaultSoftDelete;
    if (sd && (sd.excludeByDefault ?? true)) {
      const sdc = colObj[sd.column];
      if (!sdc) return c.json({ error: `Soft delete column "${sd.column}" não existe` }, 500);
      where = (and as any)(where, dEq(sdc, null as any));
    }

    let stmt: any;
    if (selectCols.length) {
      const projection: Record<string, any> = {};
      for (const col of selectCols) projection[col] = colObj[col];
      stmt = db.select(projection).from(table).where(where);
    } else {
      stmt = db.select().from(table).where(where);
    }

    const row = await stmt.get();
    if (!row) return c.json({ error: "Not found" }, 404);

    for (const [k, m] of Object.entries(cmsTable.columns)) {
      if (m.kind === "json" && typeof (row as any)[k] === "string") {
        try { (row as any)[k] = JSON.parse((row as any)[k]); } catch { }
      }
    }

    await audit("read", tableName, { id: idValue }, c);
    return c.json(row);
  });

  // ---------------- PATCH /:table/:id (update) ----------------
  app.patch(`${base}/:table/:id`, async (c) => {
    const tableName = c.req.param("table");
    const idParam = c.req.param("id");
    if (!tableNames.includes(tableName)) return c.json({ error: "Tabela inválida" }, 404);
    if (await checkRate(c, tableName, "UPDATE")) return;

    const db = opts.database(c);
    const table = pickTable(opts.schema, tableName);
    const cmsTable = opts.config[tableName as keyof TCms] as unknown as TableCmsSchemaTyped<any, any>;
    const cfg = opts.tables?.[tableName];
    const idCol = (cfg?.idColumn ?? "id") as string;
    const colObj: any = table as any;

    let body: unknown;
    try { body = await c.req.json(); } catch { return c.json({ error: "JSON inválido" }, 400); }

    let data: any;
    try { data = (cmsTable.update as z.ZodTypeAny).parse(body); }
    catch (err: any) { return c.json({ error: "ValidationError", details: err?.issues ?? String(err) }, 422); }

    ensureAllowedFields(data, cfg?.readOnly);

    // tenant
    const tenantCfg = cfg?.tenant === null ? null : cfg?.tenant ?? defaultTenant;
    if (tenantCfg) {
      const tenantId = tenantCfg.getTenantId(c);
      if (tenantCfg.required !== false && (tenantId === undefined || tenantId === null || tenantId === "")) {
        return c.json({ error: "Tenant required" }, 400);
      }
      if (tenantId != null && tenantCfg.column in data) delete data[tenantCfg.column];
    }

    if (cfg?.acl?.canUpdate && !(await cfg.acl.canUpdate({ c, id: idParam, data })))
      return c.json({ error: "Forbidden" }, 403);
    if (cfg?.hooks?.beforeUpdate) data = await cfg.hooks.beforeUpdate(data, { c, id: idParam });

    data = normalizeForDb(data, cmsTable, cfg, serialize);

    let where = dEq(colObj[idCol], coerceId(idParam));
    if (tenantCfg) {
      const tenantId = tenantCfg.getTenantId(c);
      if (tenantId != null) where = (and as any)(where, dEq(colObj[tenantCfg.column], tenantId as any));
    }

    const updated = await db.update(table).set(data).where(where).returning().get();
    if (!updated) return c.json({ error: "Not found" }, 404);

    await audit("update", tableName, { id: coerceId(idParam), data: updated }, c);
    if (cfg?.hooks?.afterUpdate) await cfg.hooks.afterUpdate(updated, { c, id: idParam });
    return c.json(updated);
  });

  // ---------------- DELETE /:table/:id (hard or soft) ----------------
  app.delete(`${base}/:table/:id`, async (c) => {
    const tableName = c.req.param("table");
    const idParam = c.req.param("id");
    if (!tableNames.includes(tableName)) return c.json({ error: "Tabela inválida" }, 404);
    if (await checkRate(c, tableName, "DELETE")) return;

    const db = opts.database(c);
    const table = pickTable(opts.schema, tableName);
    const cfg = opts.tables?.[tableName];
    const idCol = (cfg?.idColumn ?? "id") as string;
    const colObj: any = table as any;

    if (cfg?.acl?.canDelete && !(await cfg.acl.canDelete({ c, id: idParam })))
      return c.json({ error: "Forbidden" }, 403);
    if (cfg?.hooks?.beforeDelete) await cfg.hooks.beforeDelete({ c, id: idParam });

    // tenant
    const tenantCfg = cfg?.tenant === null ? null : cfg?.tenant ?? defaultTenant;
    let where = dEq(colObj[idCol], coerceId(idParam));
    if (tenantCfg) {
      const tenantId = tenantCfg.getTenantId(c);
      if (tenantCfg.required !== false && (tenantId === undefined || tenantId === null || tenantId === "")) {
        return c.json({ error: "Tenant required" }, 400);
      }
      if (tenantId != null) where = (and as any)(where, dEq(colObj[tenantCfg.column], tenantId as any));
    }

    const sd = cfg?.softDelete === null ? null : cfg?.softDelete ?? defaultSoftDelete;
    if (sd) {
      const col = colObj[sd.column];
      if (!col) return c.json({ error: `Soft delete column "${sd.column}" não existe` }, 500);

      const val = sd.valueFactory ? sd.valueFactory() : new Date();
      const toSet =
        serialize.dates === "ms" ? val.getTime() : serialize.dates === "iso" ? val.toISOString() : val;

      const deleted = await db.update(table).set({ [sd.column]: toSet } as any).where(where).returning().get();
      if (!deleted) return c.json({ error: "Not found" }, 404);

      await audit("delete", tableName, { id: coerceId(idParam), soft: true }, c);
      if (cfg?.hooks?.afterDelete) await cfg.hooks.afterDelete({ c, id: idParam });
      return c.json({ ok: true, soft: true });
    } else {
      const deleted = await db.delete(table).where(where).returning().get();
      if (!deleted) return c.json({ error: "Not found" }, 404);

      await audit("delete", tableName, { id: coerceId(idParam), soft: false }, c);
      if (cfg?.hooks?.afterDelete) await cfg.hooks.afterDelete({ c, id: idParam });
      return c.json({ ok: true, soft: false });
    }
  });

  return app;
}