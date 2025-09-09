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
  isNullable: boolean;      // inclui optional
  isPrimaryKey: boolean;
  hasDefault: boolean;
  enumValues?: readonly string[];
  order: number;            // índice estável para ordenar/mostrar
};

export type FieldShapeMeta = {
  kind: FieldKind;
  optional: boolean;
  nullable: boolean;
  hasDefault: boolean;
  enumValues?: readonly string[];
};

export type TableCmsSchemaTyped<Insert, Select> = {
  tableName: string;
  insert: z.ZodType<Insert>;
  select: z.ZodType<Select>;
  update: z.ZodType<Partial<Insert>>;

  // mapa por nome (acesso O(1))
  columns: { [K in keyof Select & string]: ColumnMeta };

  // array já pronta (sem precisar Object.values)
  fields: ColumnMeta[];

  // visão “JSON/objeto” do schema (útil pra render)
  shape: {
    insert: Record<string, FieldShapeMeta>;
    select: Record<string, FieldShapeMeta>;
    update: Record<string, FieldShapeMeta>;
  };

  // estatísticas úteis
  stats: {
    fieldCount: number;
    requiredCount: number;
    optionalCount: number;
    kinds: Record<FieldKind, number>;
  };

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
    [columnName: string]: ColumnOverride | { schema: ColumnOverride; isPrimaryKey?: boolean };
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
  return (
    lc.endsWith("at") ||
    lc.endsWith("date") ||
    lc.includes("created") ||
    lc.includes("updated")
  );
}

/** Desembrulha efeitos/optional/nullable/default e retorna flags + base schema */
function unwrapZod(ztype: ZodTypeAny): {
  base: ZodTypeAny;
  optional: boolean;
  nullable: boolean;
  hasDefault: boolean;
  enumValues?: readonly string[];
} {
  let cur: ZodTypeAny = ztype;
  let optional = false;
  let nullable = false;
  let hasDefault = false;
  let enumValues: readonly string[] | undefined;

  while (cur) {
    const def: any = cur._def;
    if (!def) break;

    if (def.type === "default") {
      hasDefault = true;
      cur = def.innerType;
      continue;
    }
    if (def.type === "optional") {
      optional = true;
      cur = def.innerType;
      continue;
    }
    if (def.type === "nullable") {
      nullable = true;
      cur = def.innerType;
      continue;
    }
    if (def.type === "pipe") {
      cur = def.out;
      continue;
    }
    if (def.type === "enum") {
      enumValues = def.values ?? def.options;
      break;
    }

    break;
  }

  return { base: cur, optional, nullable, hasDefault, enumValues };
}

function guessFieldKindFromZod(ztype: ZodTypeAny): FieldKind {
  const def: any = (ztype as any)?._def;
  if (!def) return "unknown";

  switch (def.type) {
    case "string": return "string";
    case "number": return "number";
    case "boolean": return "boolean";
    case "date": return "date";
    case "enum": return "enum";
    case "any": return "json";
    case "unknown": return "unknown";
    case "pipe":
      // unwrap o out
      return guessFieldKindFromZod(def.out);
    case "nullable":
    case "optional":
      return guessFieldKindFromZod(def.innerType);
    default:
      return "unknown";
  }
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
      // permite { schema, isPrimaryKey } ou override "nu"
      out[col] = (typeof override === "object" && "safeParse" in override)
        ? (override as ZodTypeAny)
        : (override as any).schema ?? schema;
      continue;
    }

    if (heuristicDates && looksLikeDateColumn(col)) {
      out[col] = z
        .union([z.number(), z.string().datetime().or(z.string())])
        .transform((v) => {
          if (typeof v === "number") return new Date(v);
          const d = new Date(v);
          if (isNaN(d.getTime()))
            throw new Error(`Data inválida em ${tableName}.${col}`);
          return d;
        });
      continue;
    }

    out[col] = schema;
  }

  return out;
}

function shapeToColumnMeta(
  shape: Record<string, ZodTypeAny>,
  tableName: string,
  overrides?: OverrideMap
): { map: Record<string, ColumnMeta>; list: ColumnMeta[] } {
  const map: Record<string, ColumnMeta> = {};
  const list: ColumnMeta[] = [];

  const tableOverrides = overrides?.[tableName] ?? {};

  Object.keys(shape).forEach((name, i) => {
    const schema = shape[name];
    const { optional, nullable, hasDefault, enumValues } = unwrapZod(schema);
    const kind = guessFieldKindFromZod(schema);

    let isPrimaryKey = false;
    const override = tableOverrides?.[name];
    if (override && typeof override === "object" && !("safeParse" in override)) {
      isPrimaryKey = Boolean((override as any).isPrimaryKey);
    }


    const meta: ColumnMeta = {
      // replace camelCase -> "Camel Case"
      name,
      kind,
      isNullable: optional || nullable,
      isPrimaryKey,
      hasDefault,
      enumValues,
      order: i,
    };

    map[name] = meta;
    list.push(meta);
  });

  return { map, list };
}

function shapeToFieldShapeMeta(
  shape: Record<string, ZodTypeAny>
): Record<string, FieldShapeMeta> {
  const out: Record<string, FieldShapeMeta> = {};
  for (const [name, ztype] of Object.entries(shape)) {
    const { optional, nullable, hasDefault, enumValues } = unwrapZod(ztype);
    out[name] = {
      kind: guessFieldKindFromZod(ztype),
      optional,
      nullable,
      hasDefault,
      enumValues,
    };
  }
  return out;
}

function buildStats(fields: ColumnMeta[]) {
  const kinds: Record<FieldKind, number> = {
    string: 0,
    number: 0,
    boolean: 0,
    date: 0,
    json: 0,
    enum: 0,
    blob: 0,
    unknown: 0,
  };

  let optionalCount = 0;
  for (const f of fields) {
    kinds[f.kind] = (kinds[f.kind] ?? 0) + 1;
    if (f.isNullable) optionalCount++;
  }

  return {
    fieldCount: fields.length,
    requiredCount: fields.length - optionalCount,
    optionalCount,
    kinds,
  };
}


// ====== Main Function ======
export function drizzleBuilder<TSchema extends Record<string, any>>(
  schema: TSchema,
  options: BuildOptions = {}
): CmsFromSchema<TSchema> {
  const cmsAny: any = {};

  for (const [key, value] of Object.entries(schema)) {
    if (!isTable(value)) continue;

    const table = value as Table;
    const tableName = getTableName(table);

    // drizzle-zod -> Zod a partir da tabela
    const insertBase = createInsertSchema(table);
    const selectBase = createSelectSchema(table);

    const insertShape = (insertBase as ZodObject<any>).shape;
    const selectShape = (selectBase as ZodObject<any>).shape;

    const insertWithFixes = z.object(
      applyOverridesToShape(
        insertShape,
        tableName,
        options.overrides,
        options.heuristicDates
      )
    );
    const selectWithFixes = z.object(
      applyOverridesToShape(
        selectShape,
        tableName,
        options.overrides,
        options.heuristicDates
      )
    );

    const update = insertWithFixes.partial();

    // meta por coluna (map + list)
    const { map: columns, list: fields } = shapeToColumnMeta(
      selectWithFixes.shape,
      tableName,
      options.overrides
    );

    // shapes “JSON/objeto”
    const shape = {
      insert: shapeToFieldShapeMeta(insertWithFixes.shape),
      select: shapeToFieldShapeMeta(selectWithFixes.shape),
      update: shapeToFieldShapeMeta(update.shape),
    };

    // stats
    const stats = buildStats(fields);

    cmsAny[key] = {
      tableName,
      insert: insertWithFixes,
      select: selectWithFixes,
      update,
      columns,
      fields,
      shape,
      stats,
    };
  }

  return cmsAny as CmsFromSchema<TSchema>;
}

// ====== Types Helpers ======
export type InsertOf<TCms, K extends keyof TCms> =
  TCms[K] extends TableCmsSchemaTyped<infer I, any> ? I : never;

export type SelectOf<TCms, K extends keyof TCms> =
  TCms[K] extends TableCmsSchemaTyped<any, infer S> ? S : never;

export type UpdateOf<TCms, K extends keyof TCms> =
  TCms[K] extends TableCmsSchemaTyped<infer I, any> ? Partial<I> : never;
