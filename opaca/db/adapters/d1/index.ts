import { drizzle } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { OpacaDbAdapter, DrizzleLikeDatabase } from "@opaca/db/types";
import * as schema from "@/schema";

export type D1AdapterOptions = {
  devMode?: boolean;          // true: use getCloudflareContext() sync (only in development)
  binding?: D1Database;       // option to pass the D1Database binding directly
};

// Lazy-load schema to avoid import cycles during schema build.
let __schemaModule: any | null = null;
async function loadSchema(): Promise<typeof schema> {
  if (__schemaModule) return __schemaModule;
  // IMPORTANT: dynamic import prevents ESM TDZ when opaca.config.ts is being evaluated
  __schemaModule = await import("@/schema");
  return __schemaModule;
}

export function D1Adapter(opts: D1AdapterOptions = {}): OpacaDbAdapter {
  let dbInst: DrizzleLikeDatabase | null = null;

  function getDevBinding(): D1Database {
    return getCloudflareContext().env.DB;
  }

  async function getEdgeBinding(): Promise<D1Database> {
    return (await getCloudflareContext({ async: true })).env.DB;
  }

  function getDbSync(): DrizzleLikeDatabase {
    const binding = opts.binding ?? (opts.devMode ? getDevBinding() : undefined);
    if (!binding) throw new Error("D1 binding not available in sync mode.");
    // In sync mode we require the caller to have preloaded the schema via opts.schema
    // or ensure that no schema import happens during build.
    // const schemaRef = (globalThis as any).__OPACA_SCHEMA__;
    // if (!schemaRef) {
    //   throw new Error("Schema not available in sync mode. Use getDbAsync() or set global __OPACA_SCHEMA__ first.");
    // }
    // if (!dbInst) dbInst = drizzle(binding, { schema: schemaRef }) as unknown as DrizzleLikeDatabase;
    if (!dbInst) dbInst = drizzle(binding) as unknown as DrizzleLikeDatabase;
    return dbInst!;
  }

  async function getDbAsync(): Promise<DrizzleLikeDatabase> {
    if (dbInst) return dbInst;
    const binding = opts.binding ?? (await getEdgeBinding());
    const schemaMod = await loadSchema();
    dbInst = drizzle(binding, { schema: schemaMod }) as unknown as DrizzleLikeDatabase;
    return dbInst!;
  }

  return {
    dialect: "d1",
    getDb: () => {
      if (opts.devMode || opts.binding) {
        return getDbSync();
      }
      throw new Error("getDb() can only be called in devMode or with a binding. Use getDbAsync() otherwise.");
    },
    getDbAsync,
    getLoadedSchema: async () => await loadSchema()
  };
}