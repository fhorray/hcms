import * as schema from "@/server/db/schema"; // seu export do Drizzle
import { z } from "zod";
import { drizzleBuilder } from "./builders/drizzle";
import { createRouter } from "./server";
import { getDb } from "@/server/db";
import { createApiClient } from "./client/api";

import dotenv from "dotenv";
dotenv.config({
  path: ".dev.vars"
});

// Ex.: em SQLite/D1 você armazena JSON como TEXT → trate como z.any()
export const hcms = drizzleBuilder(schema, {
  heuristicDates: true,
  overrides: {
    products: {
      // suponha que "tags" é TEXT mas você quer JSON no frontend do CMS
      tags: z
        .string()
        .or(z.record(z.string(), z.any()))
        .or(z.array(z.any()))
        .transform((v) => (typeof v === "string" ? JSON.parse(v) : v))
        .optional(),
    },
  },
});

// Create hono Router
export const router = createRouter({
  config: hcms,
  database: () => getDb(),
  schema: schema,
})
