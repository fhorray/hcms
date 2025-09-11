import fs from "fs";
import config from "@opaca-config";
import dotenv from "dotenv";
dotenv.config({
  path: ".dev.vars"
});

const lines: string[] = [];
lines.push(`// AUTO-GENERATED FILE — do not edit manually`);
lines.push(`import { buildDrizzleTable } from "@/cms/helpers/drizzle";`);
lines.push(`import config from "@opaca-config";`);

if (process.env.OPACA_DB_DIALECT === 'd1' || process.env.OPACA_DB_DIALECT === 'sqlite') {
  lines.push(`import * as defaultSchema from "./default-sqlite";`);
} else {
  lines.push(`import * as defaultSchema from "./default-pg";`);
}

for (const col of Object.values(config.collections)) {
  lines.push(`export const ${col.slug} = buildDrizzleTable(config.collections["${col.slug}"]);`);
}

if (process.env.OPACA_DB_DIALECT === 'd1' || process.env.OPACA_DB_DIALECT === 'sqlite') {
  lines.push(`export const { sessions, accounts, verifications } = defaultSchema;`);
} else {
  lines.push(`export const { sessions, accounts, verifications } = defaultSchema;`);
}

fs.writeFileSync("cms/server/db/schema.ts", lines.join("\n"));
