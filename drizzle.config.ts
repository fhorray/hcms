import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./server/db/schema.generated.ts",
  out: "./server/db/migrations",
  dialect: "sqlite",
  driver: "d1-http",
  // dbCredentials: {
  //   accountId: process.env.CF_ACCOUNT_ID!,
  //   databaseId: process.env.CF_DATABASE_ID!,  // mesmo do wrangler.toml
  //   token: process.env.CF_API_TOKEN!
  // }
});
