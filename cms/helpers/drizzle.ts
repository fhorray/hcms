import * as schema from '@/server/db/schema';
import type { z } from 'zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

type AnyTable = { $inferSelect: any; $inferInsert: any };

// Keys de S que realmente são tabelas do Drizzle
type TableKeys<S> = {
  [K in keyof S]: S[K] extends AnyTable ? K : never
}[keyof S];

// Mapa de tipos "row" (SELECT) por tabela
export type SelectOf<S> = {
  [K in keyof S as S[K] extends AnyTable ? K : never]:
  S[K] extends { $inferSelect: infer R } ? R : never
};

// Mapa de tipos "insert" por tabela
export type InsertOf<S> = {
  [K in keyof S as S[K] extends AnyTable ? K : never]:
  S[K] extends { $inferInsert: infer R } ? R : never
};

// Aplicado ao seu schema concreto
export type Tables = TableKeys<typeof schema>;
export type SelectMap = SelectOf<typeof schema>;
export type InsertMap = InsertOf<typeof schema>;

// Helpers para pegar o tipo de uma tabela específica:
//   type Banner = Select<'banners'>;
//   type NewBanner = Insert<'banners'>;
export type Select<K extends Tables> = SelectMap[K];
export type Insert<K extends Tables> = InsertMap[K];

// Constrói objetos de Zod por tabela: zod.select[key], zod.insert[key]
export const zod = (function buildZodSchemas() {
  const select = {} as { [K in Tables]: z.ZodType<SelectMap[K]> };
  const insert = {} as { [K in Tables]: z.ZodType<InsertMap[K]> };

  for (const key of Object.keys(schema) as Tables[]) {
    const table = (schema as Record<string, unknown>)[key] as unknown;
    if (
      table &&
      typeof table === 'object' &&
      '$inferSelect' in (table as any) &&
      '$inferInsert' in (table as any)
    ) {
      (select as any)[key] = createSelectSchema(table as any);
      (insert as any)[key] = createInsertSchema(table as any);
    }
  }

  return { select, insert } as const;
})();