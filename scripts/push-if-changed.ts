import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import Bun from "bun";

const SCHEMA = "server/db/schema.ts";
const HASH_FILE = ".schema.hash";
const DRIZZLE_CONFIG = process.env.DRIZZLE_CONFIG || "drizzle-dev.config.ts";

function sha1(buf: Buffer | string) {
  return createHash("sha1").update(buf).digest("hex");
}

if (!existsSync(SCHEMA)) {
  console.error(`[push-if-changed] ${SCHEMA} não existe. Gere-o primeiro.`);
  process.exit(1);
}

const current = readFileSync(SCHEMA);
const currentHash = sha1(current);
const prevHash = existsSync(HASH_FILE) ? readFileSync(HASH_FILE, "utf8").trim() : "";

if (currentHash === prevHash) {
  console.log("[push-if-changed] schema sem mudanças, pulando drizzle-kit push.");
  process.exit(0);
}

writeFileSync(HASH_FILE, currentHash);

console.log(`[push-if-changed] mudanças detectadas → executando drizzle-kit push (--config=${DRIZZLE_CONFIG})`);
const child = Bun.spawn({
  cmd: ["bunx", "drizzle-kit", "push", `--config=${DRIZZLE_CONFIG}`],
  stdin: "inherit",
  stdout: "inherit",
  stderr: "inherit",
});

const status = await child.exited;
process.exit(status);