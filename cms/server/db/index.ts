// db.ts
import { cache } from "react";
import * as schema from "@/cms/server/db/schema";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import { drizzle as drizzlePG } from "drizzle-orm/node-postgres";
import { drizzle as drizzleSQL } from "drizzle-orm/libsql";
import { Pool } from "pg";

const dialect = process.env.OPACA_DB_DIALECT!

export const getDb = cache(async () => {
  switch (dialect) {
    case "d1": {
      const context = await getCloudflareContext({ async: true });
      const d1 = context.env.DB;
      return drizzleD1(d1, { schema });
    }
    case "sqlite": {
      return drizzleSQL({
        connection: {
          url: process.env.OPACA_DB_URL!,
          authToken: process.env.OPACA_DB_AUTH_TOKEN!,
        },
      });
    }
    case "pg": {
      const pool = new Pool({
        connectionString: process.env.OPACA_DB_URL,
        maxUses: 1,
      });
      return drizzlePG({ client: pool, schema });
    }
    default:
      throw new Error(`Unsupported dialect: ${dialect}`);
  }
});
