import { pluralize, slugify } from "@/lib/utils";
import { FieldTypeInput, OpacaCollection, OpacaField } from "../types/config";
import { applyCommonColumnModifiers, createId, flattenFields, peekOptionValueType } from "./helpers";

import {
  sqliteTable,
  integer as sqInt,
  text as sqText,
  index as sqIndex,
} from "drizzle-orm/sqlite-core";

export function buildSqliteTable(collection: OpacaCollection) {
  if (!collection) throw new Error("Collection is undefined");

  const slug = slugify(pluralize(collection.name)).toLowerCase()

  const flatFields = flattenFields(collection.fields ?? []);

  const columns: Record<string, any> = {};
  const indexSpecs: Array<{ key: string; make: (t: any) => any }> = [];

  // Create default columns (id, created at, updated at etc...)
  columns["id"] = sqText("id")
    .primaryKey()
    .$defaultFn(() => createId(15))
    .notNull();
  columns["createdAt"] = sqInt("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date());
  columns["updatedAt"] = sqInt("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date()).$onUpdateFn(() => new Date());

  for (const f of flatFields) {
    if (!("name" in f) || !f?.name) {
      throw new Error(`Field without "name" in collection "${slug}"`);
    }

    // Skip default columns
    if (f.name === "id" || f.name === "createdAt" || f.name === "updatedAt") continue;

    const propertyKey = f.name;
    const dbName = (f.columnName ?? slugify(f.name, { separator: "_" })).toLowerCase();

    const col = makeSqliteColumn(dbName, f);
    if (!col) continue;

    const built = applyCommonColumnModifiers(col, f);
    columns[propertyKey] = built;

    // Explicit references -> optional index
    if ((f as any).references?.table && (f as any).references?.field) {
      const idxName = `${slug}_${dbName}_ref_idx`;
      indexSpecs.push({
        key: idxName,
        make: (t: any) => sqIndex(idxName).on(t[propertyKey]),
      });
    }

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
  const t = (f as any).type as FieldTypeInput;

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
        // integer with numeric mode (int); switch to real() if needed
        return sqInt(name, { mode: "number" });

      case "checkbox":
      case "switcher":
        // boolean mode is emitted/stored as 0/1
        return sqInt(name, { mode: "boolean" });

      case "date":
        // Store as unix epoch (ms) using timestamp mode for portability
        return sqInt(name, { mode: "timestamp" });

      case "json":
        return sqText(name, { mode: "json" }).$type<Record<string, any>>().default({});
      case "array":
        return sqText(name, { mode: "json" }).$type<any[]>().default([]);

      // Structural-only types
      case "group":
      case "tabs":
      case "collapsible":
      case "blocks":
      case "ui":
      case "join":
        return undefined;

      default:
        return undefined;
    }
  }

  // Relationship object
  if ("relationship" in (t as any)) {
    const rel = (t as any).relationship as {
      to: string;
      many?: boolean;
      through?: string;
    };

    if (rel.many) {
      // JSON string array of FK ids in SQLite
      // Use $type to aid TS userland (still stored as TEXT)
      return sqText(name).$type<Array<string>>();
    }
    // Single FK id as TEXT (cuid)
    return sqText(name);
  }

  // Select object
  if ("select" in (t as any)) {
    const sel = (t as any).select as {
      options: { label: string; value: string | number }[];
      multiple?: boolean;
      relationship?: { to: string; valueField: string };
    };

    // Relationship-backed select: store valueField(s)
    if (sel.relationship) {
      if (sel.multiple) {
        return sqText(name).$type<Array<string | number>>(); // JSON string array
      }
      return typeof peekOptionValueType(sel.options) === "number"
        ? sqInt(name, { mode: "number" })
        : sqText(name);
    }

    // Static options
    if (sel.multiple) {
      return sqText(name).$type<Array<string | number>>(); // JSON string array
    }
    return typeof peekOptionValueType(sel.options) === "number"
      ? sqInt(name, { mode: "number" })
      : sqText(name);
  }

  return undefined;
}