import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";
dotenv.config({
  path: ".dev.vars"
});

import config from "@opaca-config"

if (!process.env.OPACA_DB_DIALECT) {
  throw new Error("Missing OPACA_DB_DIALECT env var");
}

const dialect = process.env.OPACA_DB_DIALECT || config.database?.dialect;

export default

  // d1 config
  dialect === "d1" ?
    defineConfig({
      schema: config.database?.schemaDir ?? "schema.ts",
      out: config.database?.migrationsDir ?? "./migrations",
      dialect: "sqlite",
      driver: "d1-http",
      dbCredentials: {
        accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
        databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
        token: process.env.CLOUDFLARE_TOKEN!
      },
      verbose: true
    }) :

    // sqlite config
    dialect === "sqlite" ?
      defineConfig({
        schema: "schema.ts",
        out: "./migrations",
        dialect: "sqlite",
        dbCredentials: {
          url: process.env.OPACA_DB_URL!
        },
        verbose: true,
        strict: false,
      }) :

      // postgres config
      defineConfig({
        schema: "schema.ts",
        out: "./migrations",
        dialect: "postgresql",
        dbCredentials: {
          url: process.env.OPACA_DB_URL!
        },
        verbose: true,
        strict: false,
      })
  ;
