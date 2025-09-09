// cms/schema/index.ts
import * as schema from "@/server/db/schema"; // seu export do Drizzle
import { z } from "zod";
import { buildCmsSchemas } from "./buid-schema";

// Ex.: em SQLite/D1 você armazena JSON como TEXT → trate como z.any()
export const cmsConfig = buildCmsSchemas(schema, {
  heuristicDates: true,
  overrides: {
    products: {
      // suponha que "tags" é TEXT mas você quer JSON no CMS
      tags: z
        .string()
        .or(z.record(z.string(), z.any()))
        .or(z.array(z.any()))
        .transform((v) => (typeof v === "string" ? JSON.parse(v) : v))
        .optional(),
    },
  },
});

// Agora cms.products.insert / select / update são Zods prontos
export const productInsert = cmsConfig.products.insert;
export const productSelect = cmsConfig.products.select;
export const productUpdate = cmsConfig.products.update;

// Metadados que seu cmsConfig pode usar para renderizar widgets:
export const productFields = cmsConfig.products.columns;