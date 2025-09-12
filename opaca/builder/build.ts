import { Dialect } from "@opaca/db/adapter";
import { OpacaCollection } from "@opaca/types/config";
import { buildPgTable } from "./pg";
import { buildSqliteTable } from "./sqlite";

/**
 * Entry point that dispatches to the correct dialect.
 * It also respects process.env.OPACA_DB_DIALECT in addition to the param.
 */
export function buildDrizzleTable(
  collection: OpacaCollection,
  dialect?: Dialect,
) {
  const env = (process.env.OPACA_DB_DIALECT || "").toLowerCase();
  const useSqlite =
    env === "d1" || env === "sqlite" || dialect === "sqlite";

  // TODO: separete functions to make builder agnostic of dialect names
  return useSqlite
    ? buildSqliteTable(collection)
    : buildPgTable(collection);
}