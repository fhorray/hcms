// scripts/watch-resources.ts
import { spawn } from "node:child_process";
import { watchFile } from "node:fs";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

function run(cmd: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit", shell: process.platform === "win32" });
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(" ")} exited ${code}`))));
  });
}

async function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  const raw = await readFile(filePath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const l = line.trim();
    if (!l || l.startsWith("#")) continue;
    const m = l.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!m) continue;
    let [, k, v] = m;
    v = v.replace(/^['"]|['"]$/g, "");
    if (!(k in process.env)) process.env[k] = v;
  }
}

async function resolveTarget(): Promise<"local" | "remote"> {
  // 1) CLI flag: --target=remote|local
  const flag = process.argv.find((a) => a.startsWith("--target="));
  if (flag) {
    const val = flag.split("=")[1]?.toLowerCase();
    if (val === "remote" || val === "local") return val;
  }
  // 2) .dev.vars e .env
  await loadEnvFile(path.resolve(".dev.vars"));
  await loadEnvFile(path.resolve(".env"));
  const envVal = (process.env.CMS_TARGET || "").toLowerCase();
  return envVal === "remote" ? "remote" : "local";
}

async function main() {
  const target = await resolveTarget();
  const cmd = target === "remote" ? ["run", "sync:remote"] : ["run", "sync:local"];

  const file = path.resolve("cms", "resources.ts"); // mude aqui se quiser observar a pasta toda
  console.log(`👀 Watching: ${file}`);
  console.log(`↪️  On change: bun ${cmd.join(" ")}`);

  let pending = false;
  let running = false;

  async function trigger() {
    if (running) { pending = true; return; }
    running = true;
    try {
      await run("bun", cmd);
    } finally {
      running = false;
      if (pending) { pending = false; trigger(); }
    }
  }

  // Observa alterações no arquivo (com polling, estável no Windows)
  watchFile(file, { interval: 250 }, (cur, prev) => {
    if (cur.mtimeMs !== prev.mtimeMs) {
      console.log("💾 Change detected. Running sync...");
      trigger();
    }
  });
}

main().catch((e) => { console.error(e); process.exit(1); });
