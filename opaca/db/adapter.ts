import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import type { PgDatabase } from "drizzle-orm/pg-core";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { SQL } from "drizzle-orm";
import * as schema from "@/cms/server/db/schema";

export type Dialect = "pg" | "sqlite" | "d1";

export type DrizzleLikeDatabase =
  | PgDatabase<any, typeof schema>
  | BaseSQLiteDatabase<any, any, typeof schema>
  | DrizzleD1Database<typeof schema>;

export interface OpacaDbAdapter {
  readonly dialect: Dialect;
  getDb(): DrizzleLikeDatabase;
  getDbAsync?(): Promise<DrizzleLikeDatabase>;
  migrate?(opts?: { dryRun?: boolean }): Promise<void>;
  close?(): Promise<void>;
  sql?: SQL;
}