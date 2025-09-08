import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";
dotenv.config({
  path: ".dev.vars"
});

export default

  process.env.CMS_DB === "sqlite" ?
    defineConfig({
      schema: "./server/db/schema.ts",
      out: "./server/db/migrations",
      dialect: "sqlite",
      driver: "d1-http",
      dbCredentials: {
        accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
        databaseId: process.env.CLOUDFLARE_DATABASE_ID!,  // mesmo do wrangler.toml
        token: process.env.CLOUDFLARE_TOKEN!
      },
      verbose: true
    }) : defineConfig({
      schema: "./server/db/schema.ts",
      out: "./server/db/migrations",
      dialect: "postgresql",
      dbCredentials: {
        url: process.env.CMS_DATABASE_URL!
      },
      verbose: true
    })
  ;
