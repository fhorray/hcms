// Lightweight utility to turn an OpacaCollection into a Drizzle table
// Works with Postgres (pg-core) and SQLite (sqlite-core).
import type { OpacaCollection, OpacaField, FieldTypeInput } from "@/cms/types/dls";

import {
  pgTable,
  integer as pgInt,
  text as pgText,
  boolean as pgBool,
  timestamp as pgTs,
  jsonb as pgJsonb,
  index as pgIndex,
} from "drizzle-orm/pg-core";

import {
  sqliteTable,
  integer as sqInt,
  text as sqText,
  index as sqIndex,
} from "drizzle-orm/sqlite-core";

import dotenv from "dotenv";
import { slugify } from "@/lib/utils";
import { init } from "@paralleldrive/cuid2";
dotenv.config({ path: ".dev.vars" });

export type Dialect = "pg" | "sqlite";

export function buildDrizzleTable(collection: OpacaCollection, dialect?: Dialect) {
  const useSqlite = process.env.OPACA_DB_DIALECT === "d1" || process.env.OPACA_DB_DIALECT === "sqlite" || dialect === "sqlite";
  return useSqlite ? buildSqliteTable(collection) : buildPgTable(collection);
}

/* ----------------------------- PG IMPLEMENTATION ----------------------------- */

function buildPgTable(collection: OpacaCollection) {
  if (!collection) throw new Error("Collection is undefined");

  const slug = slugify(pluralize(collection.name));
  // Flatten first
  const flatFields = flattenFields(collection.fields ?? []);

  const columns: Record<string, any> = {};
  const indexSpecs: Array<{ key: string; make: (t: any) => any }> = [];

  // Create "id" PK once
  columns["id"] = pgText("id").primaryKey().$defaultFn(() => init({ length: 10 })());

  for (const f of flatFields) {
    if (!f?.name) throw new Error(`Field without "name" in collection "${slug}"`);

    // Avoid colliding with the auto "id" column
    if (f.name === "id") continue;

    const propertyKey = f.name;
    const dbName = f.columnName ?? f.name;

    const col = makePgColumn(dbName, f);
    if (!col) continue;

    const built = applyCommonColumnModifiers(col, f);
    columns[propertyKey] = built;

    if (f.indexed) {
      const idxName = `${slug}_${dbName}_idx`;
      indexSpecs.push({
        key: idxName,
        make: (t: any) => pgIndex(idxName).on(t[propertyKey]),
      });
    }
  }

  const table = pgTable(slug, columns, (t) => {
    const idxObj: Record<string, any> = {};
    for (const spec of indexSpecs) idxObj[spec.key] = spec.make(t);
    return idxObj;
  });

  return table;
}

function makePgColumn(name: string, f: OpacaField) {
  const t = f.type;

  if (typeof t === "string") {
    switch (t) {
      case "text":
      case "textarea":
      case "rich-text":
      case "code":
      case "upload":
      case "email":
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
        // Simple text[] for portability; change if you need arrays of specific types
        return pgText(name).array();
      case "point":
        return pgJsonb(name).$type<{ x: number; y: number } | { lat: number; lng: number }>();
      default:
        return undefined;
    }
  }

  // Relationship object
  if ("relationship" in t) {
    const rel = t.relationship;
    if (rel.many) {
      // Store array of FK IDs as jsonb
      return pgJsonb(name).$type<Array<string | number>>();
    }
    // Store single FK id as integer by default (customize as needed)
    return pgInt(name);
  }

  // Select object
  if ("select" in t) {
    // TODO Relationship logic
    return pgJsonb(name).$type<{
      options: { label: string; value: string | number }[];
      multiple?: boolean;
    }>();
  }

  return undefined;
}

/* --------------------------- SQLITE/D1 IMPLEMENTATION ------------------------ */

function buildSqliteTable(collection: OpacaCollection) {
  if (!collection) throw new Error("Collection is undefined");

  const slug = collection.slug ?? slugify(pluralize(collection.name));
  // Flatten first
  const flatFields = flattenFields(collection.fields ?? []);

  const columns: Record<string, any> = {};
  const indexSpecs: Array<{ key: string; make: (t: any) => any }> = [];

  columns["id"] = sqText("id").primaryKey().$defaultFn(() => init({ length: 10 })());

  for (const f of flatFields) {
    if (!f?.name) throw new Error(`Field without "name" in collection "${slug}"`);

    // Avoid colliding with the auto "id" column
    if (f.name === "id") continue;

    const propertyKey = f.name;
    const dbName = f.columnName ?? slugify(f.name, { separator: "_" });

    const col = makeSqliteColumn(dbName, f);
    if (!col) continue;

    const built = applyCommonColumnModifiers(col, f);
    columns[propertyKey] = built;

    if (f.indexed) {
      const idxName = `${slug}_${dbName}_idx`;
      indexSpecs.push({
        key: idxName,
        make: (t: any) => sqIndex(idxName).on(t[propertyKey]),
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

function makeSqliteColumn(name: string, f: OpacaField) {
  const t = f.type;

  if (typeof t === "string") {
    switch (t) {
      case "text":
      case "textarea":
      case "rich-text":
      case "code":
      case "upload":
      case "email":
      case "radio-group":
      case "point":
        return sqText(name);
      case "number":
        return sqInt(name, { mode: "number" });
      case "checkbox":
      case "switcher":
        return sqInt(name, { mode: "boolean" });
      case "date":
        // Store as unix epoch (seconds) for portability
        return sqInt(name, { mode: "timestamp" });
      case "json":
      case "array":
        // Store as JSON string; hydrate in app code
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

/* --------------------------------- HELPERS ---------------------------------- */
function isStructuralType(t: FieldTypeInput): boolean {
  // Only skip literal structural strings; objects are handled by flattenFields().
  const structural = new Set(["group", "tabs", "collapsible", "blocks", "row", "ui", "join"]);
  return typeof t === "string" && structural.has(t);
}

function applyCommonColumnModifiers<T>(col: T, f: OpacaField): T {
  let c: any = col;

  if (f.required && typeof c.notNull === "function") c = c.notNull();
  if (f.unique && typeof c.unique === "function") c = c.unique();

  if (f.default !== undefined) {
    if (f.default === "now" && typeof c.defaultNow === "function") {
      c = c.defaultNow();
    } else if (typeof c.default === "function") {
      c = c.default(f.default as any);
    }
  }

  if ((f as any).primaryKey === true && typeof c.primaryKey === "function") {
    c = c.primaryKey();
  }

  return c as T;
}

function pluralize(s: string): string {
  const n = s.trim();
  if (/s$/i.test(n)) return n;
  return `${n}s`;
}

function flattenFields(fields: OpacaField[], prefix = ""): OpacaField[] {
  const out: OpacaField[] = [];

  for (const f of fields) {
    const t: any = f.type;

    // Handle structural containers and recurse into children:
    if (t && typeof t === "object") {
      // row: [{...}, {...}]
      if (Array.isArray(t.row)) {
        out.push(...flattenFields(t.row as OpacaField[], prefix));
        continue;
      }
      // generic "fields" container: { fields: [...] }
      if (Array.isArray(t.fields)) {
        out.push(...flattenFields(t.fields as OpacaField[], prefix));
        continue;
      }
      // tabs: [{ name, fields: [...] }, ...]
      if (Array.isArray(t.tabs)) {
        for (const tab of t.tabs) {
          if (Array.isArray(tab?.fields)) {
            out.push(...flattenFields(tab.fields as OpacaField[], prefix));
          }
        }
        continue;
      }
      // blocks: [{ slug, fields: [...] }, ...]
      if (Array.isArray(t.blocks)) {
        for (const block of t.blocks) {
          if (Array.isArray(block?.fields)) {
            out.push(...flattenFields(block.fields as OpacaField[], prefix));
          }
        }
        continue;
      }
    }

    // Leaf field: preserve as a real column candidate.
    // Optional: if you want a name prefix coming from container, set columnName here.
    if (prefix) {
      out.push({
        ...f,
        columnName: f.columnName ?? `${prefix}${f.name}`,
      });
    } else {
      out.push(f);
    }
  }

  return out;
}
