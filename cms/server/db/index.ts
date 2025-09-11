
import { cache } from "react";
import * as schema from "@/cms/server/db/schema";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import { drizzle as drizzlePG } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// export const runtime = process.env.OPACA_DB_DIALECT!

export const getDbD1 = cache(async () => {
  const context = await getCloudflareContext({ async: true });
  const d1 = context.env.DB;
  return drizzleD1(d1, { schema });
});

export const getDbPg = cache(() => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    maxUses: 1,
  });
  return drizzlePG({ client: pool, schema });
});