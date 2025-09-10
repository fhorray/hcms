import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";
dotenv.config({
  path: ".dev.vars"
});

export default

  // d1 config
  process.env.OPACA_DB_DIALECT === "d1" ?
    defineConfig({
      schema: "./cms/server/db/schema.ts",
      out: "./cms/server/db/migrations",
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
    process.env.OPACA_DB_DIALECT === "sqlite" ?
      defineConfig({
        schema: "./cms/server/db/schema.ts",
        out: "./cms/server/db/migrations",
        dialect: "sqlite",
        dbCredentials: {
          url: process.env.CMS_DATABASE_URL!
        },
        verbose: true,
        strict: false,
      }) :

      // postgres config
      defineConfig({
        schema: "./cms/server/db/schema.ts",
        out: "./cms/server/db/migrations",
        dialect: "postgresql",
        dbCredentials: {
          url: process.env.CMS_DATABASE_URL!
        },
        verbose: true,
        strict: false,
      })
  ;
