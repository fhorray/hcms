import fs from "fs";
import config from "@opaca-config";

const lines: string[] = [];
lines.push(`// AUTO-GENERATED FILE — do not edit manually`);
lines.push(`import { buildDrizzleTable } from "@/cms/helpers/drizzle";`);
lines.push(`import config from "@opaca-config";`);

for (const col of Object.values(config.collections)) {
  lines.push(`export const ${col.slug} = buildDrizzleTable(config.collections["${col.slug}"]);`);
}

fs.writeFileSync("cms/server/db/schema.ts", lines.join("\n"));
