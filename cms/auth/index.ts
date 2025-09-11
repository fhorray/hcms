// auth.ts
import config from "@opaca-config"
import { betterAuth } from "better-auth"
import { drizzleAdapter, type DrizzleAdapterConfig } from "better-auth/adapters/drizzle"
import { getDbD1, getDbPg } from "../server/db"
import { Kysely, CamelCasePlugin } from "kysely"
import { D1Dialect, D1DialectConfig } from "kysely-d1"
import { getCloudflareContext } from "@opennextjs/cloudflare"

// Build Kysely for D1 only when needed
async function makeD1Kysely() {
  // Important: call in async context (not top-level in static route)
  const ctx = await getCloudflareContext({ async: true });
  return new Kysely({
    dialect: new D1Dialect({ database: ctx.env.DB }),
    plugins: [new CamelCasePlugin()],
  });
}

const dialect = process.env.OPACA_DB_DIALECT;

// Fix 1: always call helpers that return clients
const pgDrizzle = () => getDbPg();
const sqliteDrizzle = () => getDbD1();

const provider: DrizzleAdapterConfig["provider"] =
  dialect === "d1" || dialect === "sqlite" ? "sqlite" : "pg";

// Route by dialect
export const auth = await (async () => {
  if (dialect === "d1") {
    // Kysely built-in adapter
    const d1Db = await makeD1Kysely();
    return betterAuth({
      ...config.auth,
      // Better Auth Kysely path expects { db: ... }
      database: { db: d1Db },
      user: {
        modelName: "users",
      },
      account: {
        modelName: "accounts",
      },
      session: {
        modelName: "sessions",
      },
      verification: {
        modelName: "verifications",
      }
    });
  }

  if (dialect === "sqlite") {
    // Drizzle + SQLite
    const db = sqliteDrizzle();
    return betterAuth({
      ...config.auth,
      database: drizzleAdapter(db, { provider }), // provider = "sqlite"
    });
  }

  // Postgres via Drizzle
  const db = pgDrizzle();
  return betterAuth({
    ...config.auth,
    database: drizzleAdapter(db, { provider }), // provider = "pg"
  });
})();