import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import type { PgDatabase } from "drizzle-orm/pg-core";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { SQL } from "drizzle-orm";
import { Table } from "drizzle-orm";

//TODO: fix this import ose use it dinamically
import * as schema from "@/schema";

/** Universal DB surface to avoid union overload issues. */
export type UniversalDb = {
  select: () => any;
  insert: (tbl: Table) => any;
  update: (tbl: Table) => any;
  delete: (tbl: Table) => any;
};

export type Dialect = "pg" | "sqlite" | "d1";

export type DrizzleLikeDatabase =
  | PgDatabase<any, typeof schema>
  | BaseSQLiteDatabase<any, any, typeof schema>
  | DrizzleD1Database<typeof schema>;

export interface OpacaDbAdapter {
  readonly dialect: Dialect;
  getDb(): DrizzleLikeDatabase;
  getLoadedSchema(): typeof schema | Promise<typeof schema>;
  getDbAsync?(): Promise<DrizzleLikeDatabase>;
  migrate?(opts?: { dryRun?: boolean }): Promise<void>;
  close?(): Promise<void>;
  sql?: SQL;
}