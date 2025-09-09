import { z } from "zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

type TableSchemas = {
  insert: z.ZodTypeAny;
  select: z.ZodTypeAny;
};

function isDrizzleTable(obj: unknown): boolean {
  if (!obj || typeof obj !== "object") return false;
  const syms = Object.getOwnPropertySymbols(obj);
  return syms.some((s) => s.description === "drizzle:IsDrizzleTable");
}

function getDrizzleTableName(tbl: object): string {
  const syms = Object.getOwnPropertySymbols(tbl);
  const baseNameSym = syms.find((s) => s.description === "drizzle:BaseName");
  const nameSym = syms.find((s) => s.description === "drizzle:Name");
  // ordem de preferência: BaseName > Name > fallback
  if (baseNameSym && (tbl as any)[baseNameSym]) return (tbl as any)[baseNameSym];
  if (nameSym && (tbl as any)[nameSym]) return (tbl as any)[nameSym];
  return "table"; // fallback
}

/**
 * Generate Zod schemas from a Drizzle schema namespace object.
 * @param schemaNs Drizzle schema namespace object.
 * Ex.: import * as schema from "@/server/db/schema"
 */
export function zodFromDrizzleSchema(
  input: Record<string, unknown> | unknown[]
): Record<string, TableSchemas> {
  const entries = Array.isArray(input)
    ? (input as unknown[]).map((v, i) => [String(i), v] as const)
    : Object.entries(input);

  const out: Record<string, TableSchemas> = {};

  for (const [_key, val] of entries) {
    if (!isDrizzleTable(val)) continue;

    const table = val as object;
    const name = getDrizzleTableName(table);

    out[name] = {
      insert: createInsertSchema(table as any),
      select: createSelectSchema(table as any),
    };
  }

  return out;
}

/** Versão para uma única tabela */
export function zodFromTable(table: unknown): TableSchemas {
  if (!isDrizzleTable(table)) {
    throw new Error("Objeto informado não parece ser uma tabela do Drizzle.");
  }
  return {
    insert: createInsertSchema(table as any),
    select: createSelectSchema(table as any),
  };
}