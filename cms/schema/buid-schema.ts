// cms/schema/buildCmsSchemas.ts
import { z } from "zod";
import type { ZodTypeAny, ZodObject } from "zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { Table } from "drizzle-orm";
import { getTableName } from "drizzle-orm";

// ====== Tipos do CMS ======

export type FieldKind =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "json"
  | "enum"
  | "blob"
  | "unknown";

export type ColumnMeta = {
  name: string;
  kind: FieldKind;
  isNullable: boolean;
  isPrimaryKey: boolean;
  hasDefault: boolean;
};

export type TableCmsSchemaTyped<Insert, Select> = {
  tableName: string;
  insert: z.ZodType<Insert>;
  select: z.ZodType<Select>;
  update: z.ZodType<Partial<Insert>>;
  columns: { [K in keyof Select & string]: ColumnMeta };
};

// O retorno passa a ser mapeado pelas chaves do objeto `schema` (exports)
export type CmsFromSchema<TSchema> = {
  [K in keyof TSchema as TSchema[K] extends Table ? K : never]:
  TSchema[K] extends Table
  ? TableCmsSchemaTyped<
    TSchema[K]["$inferInsert"],
    TSchema[K]["$inferSelect"]
  >
  : never;
};

// ====== Config de overrides ======

export type ColumnOverride = z.ZodTypeAny;
export type OverrideMap = {
  [tableName: string]:
  | {
    [columnName: string]: ColumnOverride;
  }
  | undefined;
};

export type BuildOptions = {
  overrides?: OverrideMap;
  heuristicDates?: boolean;
};

// ====== Helpers ======

function isTable(x: unknown): x is Table {
  try {
    return !!getTableName(x as Table);
  } catch {
    return false;
  }
}

function looksLikeDateColumn(colName: string) {
  const lc = colName.toLowerCase();
  return lc.endsWith("at") || lc.endsWith("date") || lc.includes("created") || lc.includes("updated");
}

function guessFieldKindFromZod(ztype: ZodTypeAny): FieldKind {
  const t = (ztype as any)?._def?.typeName;
  if (t === "ZodString") return "string";
  if (t === "ZodNumber") return "number";
  if (t === "ZodBoolean") return "boolean";
  if (t === "ZodDate") return "date";
  if (t === "ZodEnum") return "enum";
  if (t === "ZodAny") return "json";
  if (t === "ZodUnknown") return "unknown";

  if (t === "ZodUnion") {
    const options = (ztype as any)._def?.options as ZodTypeAny[];
    const nonNull = options?.find((o) => (o as any)?._def?.typeName !== "ZodNull");
    return nonNull ? guessFieldKindFromZod(nonNull) : "unknown";
  }

  if (
    t === "ZodEffects" ||
    t === "ZodOptional" ||
    t === "ZodNullable" ||
    t === "ZodDefault"
  ) {
    const inner = (ztype as any)._def?.schema as ZodTypeAny;
    return inner ? guessFieldKindFromZod(inner) : "unknown";
  }

  return "unknown";
}

function applyOverridesToShape(
  shape: Record<string, ZodTypeAny>,
  tableName: string,
  overrides?: OverrideMap,
  heuristicDates?: boolean
) {
  const tableOverrides = overrides?.[tableName] ?? {};
  const out: Record<string, ZodTypeAny> = {};

  for (const [col, schema] of Object.entries(shape)) {
    const override = tableOverrides[col];
    if (override) {
      out[col] = override;
      continue;
    }

    if (heuristicDates && looksLikeDateColumn(col)) {
      out[col] = z
        .union([z.number(), z.string().datetime().or(z.string())])
        .transform((v) => {
          if (typeof v === "number") return new Date(v);
          const d = new Date(v);
          if (isNaN(d.getTime())) throw new Error(`Data inválida em ${tableName}.${col}`);
          return d;
        });
      continue;
    }

    out[col] = schema;
  }

  return out;
}

function shapeToColumnMeta(
  shape: Record<string, ZodTypeAny>
): Record<string, ColumnMeta> {
  const meta: Record<string, ColumnMeta> = {};
  for (const [name, schema] of Object.entries(shape)) {
    const def = (schema as any)?._def;

    const isOptional =
      def?.typeName === "ZodOptional" || def?.typeName === "ZodDefault" || false;
    const isNullable =
      def?.typeName === "ZodNullable" ||
      (def?.typeName === "ZodUnion" &&
        (def?.options as ZodTypeAny[])?.some((o) => (o as any)?._def?.typeName === "ZodNull")) ||
      false;

    const hasDefault = def?.typeName === "ZodDefault";

    meta[name] = {
      name,
      kind: guessFieldKindFromZod(schema),
      isNullable: isNullable || isOptional,
      isPrimaryKey: false,
      hasDefault,
    };
  }
  return meta;
}

// ====== Função principal (AGORA TIPADA) ======

export function buildCmsSchemas<TSchema extends Record<string, any>>(
  schema: TSchema,
  options: BuildOptions = {}
): CmsFromSchema<TSchema> {
  // Vamos construir usando as CHAVES do objeto `schema`.
  // Isso preserva inferência: cms.users, cms.tags, cms.products, etc.
  const cmsAny: any = {};

  for (const [key, value] of Object.entries(schema)) {
    if (!isTable(value)) continue;

    const table = value as Table;
    const tableName = getTableName(table);

    // drizzle-zod gera Zod a partir da tabela
    const insertBase = createInsertSchema(table);
    const selectBase = createSelectSchema(table);

    const insertShape = (insertBase as ZodObject<any>).shape;
    const selectShape = (selectBase as ZodObject<any>).shape;

    const insertWithFixes = z.object(
      applyOverridesToShape(insertShape, tableName, options.overrides, options.heuristicDates)
    );
    const selectWithFixes = z.object(
      applyOverridesToShape(selectShape, tableName, options.overrides, options.heuristicDates)
    );

    const update = insertWithFixes.partial();
    const columns = shapeToColumnMeta(selectWithFixes.shape);

    // Crucial: usamos a CHAVE de export do schema (ex.: "tags")
    cmsAny[key] = {
      tableName,
      insert: insertWithFixes,
      select: selectWithFixes,
      update,
      columns,
    };
  }

  return cmsAny as CmsFromSchema<TSchema>;
}

// ====== Helpers de tipo úteis ======

export type InsertOf<TCms, K extends keyof TCms> =
  TCms[K] extends TableCmsSchemaTyped<infer I, any> ? I : never;

export type SelectOf<TCms, K extends keyof TCms> =
  TCms[K] extends TableCmsSchemaTyped<any, infer S> ? S : never;

export type UpdateOf<TCms, K extends keyof TCms> =
  TCms[K] extends TableCmsSchemaTyped<infer I, any> ? Partial<I> : never;