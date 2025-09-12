import { slugify } from "@/lib/utils";
import config from "@/opaca.config";
import type { OpacaDbAdapter } from "@/opaca/db/types";
import { graphqlServer } from "@hono/graphql-server";
import { buildSchema } from "graphql";
import { Hono } from "hono";
import { makeRepo } from "../services/make-repo";
import { Variables } from "../types/hono";
import { buildSDL } from "./graphql/helpers";
import { makeRoot } from "./make-root";
import { mountPluginsRest } from "./mount-plugins";
import { mountRest } from "./mount-rest";

export function buildOpacaApi(adapter: OpacaDbAdapter) {
  const api = new Hono<{
    Variables: Variables
  }>().basePath("/api");

  api.get("/", (c) => c.json({ status: "ok", message: "Welcome to Opaca CMS API" }));

  // Per-request Drizzle + services (using your adapter.getDbAsync which also lazy-loads the schema)
  api.use("*", async (c, next) => {
    const db = adapter.getDb();
    if (!db) return c.json({ error: "Database not connected" }, 500);

    const schemaMod = await adapter.getLoadedSchema();

    if (!schemaMod) return c.json({ error: "Schema not loaded" }, 500);

    const services: Record<string, any> = {};
    for (const col of Object.values(config.collections)) {
      const key = slugify(col.name);
      services[key] = makeRepo(db, schemaMod, {
        tableName: col.name,
        pk: "id",
        slug: slugify(col.name),
        orderBy: { column: "createdAt", direction: "desc" },
      });
    }

    c.set("services", services);

    await next();
  })

  // Mount REST API if enabled on any collection
  mountRest(api, Object.values(config.collections));
  mountPluginsRest(api, config);

  // GraphQL endpoints
  const sdl = buildSDL(Object.values(config.collections));
  const schema = buildSchema(sdl);

  // Rounting for GraphQL
  const rootResolver = makeRoot(Object.values(config.collections));

  api.use("/graphql",
    graphqlServer({
      schema,
      rootResolver,
      graphiql: process.env.NODE_ENV !== "production"
    }))

  return api;
}