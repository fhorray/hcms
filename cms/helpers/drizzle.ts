// Lightweight utility to turn an OpacaCollection into a Drizzle table
// Works with Postgres (pg-core) and SQLite (sqlite-core).
// Intentionally simple: handles the most common scalar types and a few conveniences.
// You can extend the mappings as your schema grows.

import type { OpacaCollection, OpacaField, FieldTypeInput } from "@/cms/types/dls";

// ---- Dialect gates ---------------------------------------------------------
import {
  pgTable,
  serial as pgSerial,
  integer as pgInt,
  real as pgReal,
  text as pgText,
  boolean as pgBool,
  timestamp as pgTs,
  jsonb as pgJsonb,
  index as pgIndex,
} from "drizzle-orm/pg-core";

import {
  sqliteTable,
  integer as sqInt,
  real as sqReal,
  text as sqText,
  blob as sqBlob,
  index as sqIndex,
} from "drizzle-orm/sqlite-core";
import dotenv from "dotenv";
import { slugify } from "@/lib/utils";
dotenv.config({
  path: ".dev.vars",
});

export type Dialect = "pg" | "sqlite";

// ---- Public API ------------------------------------------------------------
export function buildDrizzleTable(
  collection: OpacaCollection,
) {
  return process.env.OPACA_DB_DIALECT === "d1" || process.env.OPACA_DB_DIALECT === "sqlite"
    ? buildSqliteTable(collection)
    : buildPgTable(collection)
}

// ----------------------------------------------------------------------------
// PG IMPLEMENTATION
// ----------------------------------------------------------------------------
function buildPgTable(collection: OpacaCollection) {
  if (!collection) {
    throw new Error("Collection is undefined");
  }
  const slug = collection.slug ?? slugify(pluralize(collection.name));

  const columns: Record<string, any> = {};
  const indexSpecs: Array<{ key: string; make: (t: any) => any }> = [];

  const pkField = collection.primaryKey;
  const hasCustomPk = pkField && collection.fields[pkField];

  if (!hasCustomPk) {
    columns["id"] = pgSerial("id").primaryKey();
  }

  for (const [fieldKey, raw] of Object.entries(collection.fields)) {
    const f = normalizeField(raw);

    // UI/structural types that don't map to columns (extend as needed)
    if (isStructuralType(f.type)) continue;

    const dbName = f.columnName ?? fieldKey;
    const isPk = !!(hasCustomPk && pkField === fieldKey);

    const col = makePgColumn(dbName, f, isPk);
    if (!col) continue; // unsupported types silently skipped

    // apply generic modifiers
    let built = applyCommonColumnModifiers(col, f, isPk);

    columns[fieldKey] = built;

    if (f.indexed) {
      indexSpecs.push({
        key: `${slug}_${dbName}_idx`,
        make: (t: any) => pgIndex(`${slug}_${dbName}_idx`).on(t[fieldKey]),
      });
    }
  }

  // Build table with optional index definitions
  const table = pgTable(slug, columns, (t) => {
    const idxObj: Record<string, any> = {};
    for (const spec of indexSpecs) idxObj[spec.key] = spec.make(t);
    return idxObj;
  });

  return table;
}

function makePgColumn(name: string, f: OpacaField, isPk: boolean) {
  const t = f.type;

  if (typeof t === "string") {
    switch (t) {
      case "text":
      case "textarea":
      case "rich-text":
      case "code":
      case "upload":
      case "email":
      case "select":
      case "radio-group":
        return pgText(name);
      case "number":
        return pgInt(name);
      case "checkbox":
      case "switcher":
        return pgBool(name);
      case "date":
        return pgTs(name, { mode: "date" });
      case "json":
        return pgJsonb(name);
      case "array":
        return pgText(name).array(); // store as text[] (change to specific type if needed)
      case "point":
        // Keep it portable by storing as JSON text like { x, y } or { lat, lng }
        return pgText(name).$type<{ x: number; y: number } | { lat: number; lng: number }>();
      // Structural/unsupported here are filtered earlier
      default:
        return undefined;
    }
  }

  // Object variants
  if ("relationship" in t) {
    const rel = t.relationship;
    if (rel.many) {
      // simple/portable: store array of FK IDs as jsonb
      return pgJsonb(name).$type<Array<string | number>>();
    }
    // 1:1 or many:1 — store a single FK id (integer by default)
    return pgInt(name);
  }

  return undefined;
}

// ----------------------------------------------------------------------------
// SQLITE IMPLEMENTATION
// ----------------------------------------------------------------------------
function buildSqliteTable(collection: OpacaCollection) {

  if (!collection) {
    throw new Error("Collection is undefined");
  }
  const slug = collection.slug ?? slugify(pluralize(collection.name));

  const columns: Record<string, any> = {};
  const indexSpecs: Array<{ key: string; make: (t: any) => any }> = [];

  const pkField = collection.primaryKey;
  const hasCustomPk = pkField && collection.fields[pkField];

  if (!hasCustomPk) {
    columns["id"] = sqInt("id", { mode: "number" }).primaryKey({ autoIncrement: true });
  }

  for (const [fieldKey, raw] of Object.entries(collection.fields)) {
    const f = normalizeField(raw);
    if (isStructuralType(f.type)) continue;

    const dbName = f.columnName ?? fieldKey;
    const isPk = !!(hasCustomPk && pkField === fieldKey);

    const col = makeSqliteColumn(dbName, f, isPk);
    if (!col) continue;

    let built = applyCommonColumnModifiers(col, f, isPk);
    columns[fieldKey] = built;

    if (f.indexed) {
      indexSpecs.push({
        key: `${slug}_${dbName}_idx`,
        make: (t: any) => sqIndex(`${slug}_${dbName}_idx`).on(t[fieldKey]),
      });
    }
  }

  const table = sqliteTable(slug, columns, (t) => {
    const idxObj: Record<string, any> = {};
    for (const spec of indexSpecs) idxObj[spec.key] = spec.make(t);
    return idxObj;
  });

  return table;
}

function makeSqliteColumn(name: string, f: OpacaField, isPk: boolean) {
  const t = f.type;

  if (typeof t === "string") {
    switch (t) {
      case "text":
      case "textarea":
      case "rich-text":
      case "code":
      case "upload":
      case "email":
      case "select":
      case "radio-group":
      case "point":
        return sqText(name);
      case "number":
        return sqInt(name, { mode: "number" });
      case "checkbox":
      case "switcher":
        return sqInt(name, { mode: "boolean" });
      case "date":
        // store as unix epoch (seconds) — portable
        return sqInt(name, { mode: "timestamp" });
      case "json":
      case "array":
        // store as JSON string; hydrate in app code
        return sqText(name);
      default:
        return undefined;
    }
  }

  if ("relationship" in t) {
    const rel = t.relationship;
    if (rel.many) {
      // JSON string array of FK ids in SQLite
      return sqText(name).$type<Array<string | number>>();
    }
    return sqInt(name, { mode: "number" });
  }

  return undefined;
}

// ----------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------
function normalizeField(f: OpacaField | FieldTypeInput): OpacaField {
  if (typeof f === "string") {
    return { type: f };
  }
  // If it's already an OpacaField (has a 'type' property), return as is
  if ("type" in f) {
    return f as OpacaField;
  }
  // Otherwise, wrap the object as { type: f }
  return { type: f };
}

function isStructuralType(t: FieldTypeInput): boolean {
  const structural = new Set([
    "group",
    "tabs",
    "collapsible",
    "blocks",
    "row",
    "ui",
    "join", // This often implies a separate join table; handled outside this helper.
  ]);
  if (typeof t === "string") return structural.has(t);
  return false; // enum / relationship are not structural here
}

function applyCommonColumnModifiers<T extends any>(col: T, f: OpacaField, isPk: boolean): T {
  let c: any = col;
  if (f.required && typeof c.notNull === "function") c = c.notNull();
  if (f.unique && typeof c.unique === "function") c = c.unique();

  if (f.default !== undefined && typeof c.default === "function") {
    // Allow string "now" for timestamp-ish columns
    if (f.default === "now" && typeof c.defaultNow === "function") {
      c = c.defaultNow();
    } else {
      c = c.default(f.default as any);
    }
  }

  if (isPk && typeof c.primaryKey === "function") c = c.primaryKey();
  return c;
}

function pluralize(s: string): string {
  const n = s.trim();
  if (/s$/i.test(n)) return n; // naive but good enough for a default
  return `${n}s`;
}

