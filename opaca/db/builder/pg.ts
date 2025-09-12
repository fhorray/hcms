import { pluralize, slugify } from "@/lib/utils";
import { OpacaBaseField, OpacaCollection } from "@opaca/types/config";
import { applyCommonColumnModifiers, createId, flattenFields, peekOptionValueType } from "@/opaca/db/builder/helpers";
import dotenv from "dotenv";

import {
  pgTable,
  integer as pgInt,
  text as pgText,
  boolean as pgBool,
  timestamp as pgTs,
  jsonb as pgJsonb,
  index as pgIndex,
} from "drizzle-orm/pg-core";

export function buildPgTable(collection: OpacaCollection) {
  if (!collection) throw new Error("Collection is undefined");

  const slug = slugify(pluralize(collection.name)).toLowerCase();

  // Flatten first (rows/tabs/groups/blocks become leaf fields)
  const flatFields = flattenFields(collection.fields);

  const columns: Record<string, any> = {};
  const indexSpecs: Array<{ key: string; make: (t: any) => any }> = [];

  // Create "id" PK once (cuid string)
  columns["id"] = pgText("id")
    .primaryKey()
    .$defaultFn(() => createId(15))
    .notNull();
  columns["createdAt"] = pgTs("created_at", { mode: "date" })
    .default(new Date())
  columns["updatedAt"] = pgTs("updated_at", { mode: "date" })
    .default(new Date())
    .$onUpdateFn(() => new Date());


  for (const f of flatFields) {
    if (!("name" in f) || !f?.name) {
      throw new Error(`Field without "name" in collection "${slug}"`);
    }

    // Avoid colliding with the auto "id" column
    if (f.name === "id") continue;

    const propertyKey = f.name;
    const dbName = (f.columnName ?? slugify(f.name, { separator: "_" })).toLowerCase();

    const col = makePgColumn(dbName, f);
    if (!col) continue;

    const built = applyCommonColumnModifiers(col, f);
    columns[propertyKey] = built;

    // Explicit references -> optional index (helpful for FK lookups)
    if ((f as any).references?.table && (f as any).references?.field) {
      const idxName = `${slug}_${dbName}_ref_idx`;
      indexSpecs.push({
        key: idxName,
        make: (t: any) => pgIndex(idxName).on(t[propertyKey]),
      });
    }

    // Requested index
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

function makePgColumn(name: string, f: OpacaBaseField) {
  const t = (f as any).type as OpacaBaseField["type"];

  // Primitive strings
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
        // If you need decimals, switch to numeric/real
        return pgInt(name);

      case "checkbox":
      case "switcher":
        return pgBool(name);

      case "date": {
        // Use "timestamp without time zone". If you want timestamptz, pass withTimezone: true
        return pgTs(name, { mode: "date" });
      }

      case "json":
        return pgJsonb(name);

      case "array":
        // Portable approach: text[]; customize if you need typed arrays
        return pgText(name).array();

      case "point":
        // Store as JSON for portability
        return pgJsonb(name).$type<
          { x: number; y: number } | { lat: number; lng: number }
        >();

      // Structural-only types (no direct column)
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

    // By default store FK as text (cuid) for single; array of text for many
    if (rel.many) {
      // For arrays, jsonb is safer (text[]) is possible but jsonb is more flexible
      return pgJsonb(name).$type<Array<string>>();
    }
    return pgText(name);
  }

  // Select object
  if ("select" in (t as any)) {
    const sel = (t as any).select as {
      options: { label: string; value: string | number }[];
      multiple?: boolean;
      relationship?: { to: string; valueField: string };
    };

    // If select is backed by a relationship, store valueField(s)
    if (sel.relationship) {
      if (sel.multiple) {
        return pgJsonb(name).$type<Array<string | number>>();
      }
      // Single
      // If valueField is ID-like, text is good; number is also allowed
      return typeof peekOptionValueType(sel.options) === "number"
        ? pgInt(name)
        : pgText(name);
    }

    // Static options => store value(s) with jsonb if multiple, else scalar
    if (sel.multiple) {
      return pgJsonb(name).$type<Array<string | number>>();
    }
    return typeof peekOptionValueType(sel.options) === "number"
      ? pgInt(name)
      : pgText(name);
  }

  return undefined;
}