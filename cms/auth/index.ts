import config from "@opaca-config"
import { betterAuth } from "better-auth"
import { apiKey, admin } from "better-auth/plugins"
import { drizzleAdapter, type DrizzleAdapterConfig } from "better-auth/adapters/drizzle"
import { getDb } from "../server/db"
import { Kysely, CamelCasePlugin } from "kysely"
import { D1Dialect } from "kysely-d1"
import { getCloudflareContext } from "@opennextjs/cloudflare"

const dialect = process.env.OPACA_DB_DIALECT;

// Build Kysely for D1 only when needed
async function makeD1Kysely() {
  const ctx = await getCloudflareContext({ async: true });
  return new Kysely({
    dialect: new D1Dialect({ database: ctx.env.DB }),
    plugins: [new CamelCasePlugin()],
  });
}

// Provider mapping for Drizzle adapter
const provider: DrizzleAdapterConfig["provider"] = dialect === "d1" || dialect === "sqlite" ? "sqlite" : "pg";

// Get Plugins info inside config
const plugins = [
  admin(config.auth.plugins?.admin),
  ...(config.auth.plugins?.apiKey?.enabled
    ? [apiKey(config.auth.plugins.apiKey)]
    : []),
];

// Export single auth instance
export const auth = await (async () => {
  if (dialect === "d1") {
    // Use Kysely when dialect = d1
    const d1Db = await makeD1Kysely();
    return betterAuth({
      ...config.auth,
      database: { db: d1Db }, // Kysely mode
      user: { modelName: "users" },
      account: { modelName: "accounts" },
      session: { modelName: "sessions" },
      verification: { modelName: "verifications" },
      plugins,
    });
  }

  // For sqlite + pg use drizzle adapter
  const db = await getDb();
  return betterAuth({
    ...config.auth,
    database: drizzleAdapter(db, { provider }),
    plugins,
  });
})();
