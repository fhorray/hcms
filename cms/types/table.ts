import * as schema from '@/server/db/schema';

type Schema = typeof schema;

export type TableKeys = {
  [K in keyof Schema]: Schema[K] extends { $inferSelect: any } ? K : never
}[keyof Schema];

export type RowOf<K extends TableKeys> =
  Schema[K] extends { $inferSelect: infer R } ? R : never;

export type InsertOf<K extends TableKeys> =
  Schema[K] extends { $inferInsert: infer I } ? I : never;

export type IdOf<K extends TableKeys> =
  RowOf<K> extends { id: infer P } ? P : string | number;

/** Array dinâmico com os nomes das tabelas (útil para gerar helpers) */
export const tableKeys = Object.keys(schema).filter((k) => {
  const v = (schema as any)[k];
  return v && typeof v === 'object' && '$inferSelect' in v;
}) as TableKeys[];