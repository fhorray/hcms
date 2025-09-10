// Comments in English only.
import { cache } from "react";
import * as schema from "@/cms/server/db/schema";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import { drizzle as drizzlePG } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export const runtime = process.env.OPACA_DB_DIALECT!

export const getDbD1 = cache(() => {
  const d1 = getCloudflareContext().env.DB
  return drizzleD1(d1, { schema });
});

export const getDbPg = cache(() => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // You don't want to reuse the same connection for multiple requests
    maxUses: 1,
  });
  return drizzlePG({ client: pool, schema });
});