
import { Hono } from "hono";
import type { OpacaDbAdapter } from "@/opaca/db/types";
import * as schema from "@/schema";
import type { Table } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { isDrizzleTable, parseId, resolveResult } from "./helpers";
import { UniversalDb } from "../db/types";
import config from "@/opaca.config";
import { Variables } from "../types/hono";
import { makeRepo } from "../services/make-repo";
import { slugify } from "@/lib/utils";
import { mountRest } from "./mount-rest";
import { buildSDL } from "./graphql/helpers";
import { buildSchema } from "graphql";
import { makeRoot } from "./make-root";
import { appRouterContext } from "next/dist/server/route-modules/app-route/shared-modules";
import { graphqlServer } from "@hono/graphql-server";

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