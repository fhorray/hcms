// scripts/sync.ts
// Orquestra: codegen -> drizzle generate -> d1 apply
// Se falhar no LOCAL por conflito, reseta o DB local automaticamente (estilo Payload).
//
// Uso automatizado via package.json (predev/prestart/prebuild/predeploy)

import { spawn } from "node:child_process";
import dotenv from "dotenv";
dotenv.config({
  path: ".dev.local",
});

function run(cmd: string, args: string[], env: Record<string, string | undefined> = {}) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: "inherit",
      shell: process.platform === "win32",
      env: { ...process.env, ...env },
    });
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(" ")} exited ${code}`))));
  });
}

const DB_BINDING = process.env.CMS_DB_BINDING || "DB"; // mesmo nome do binding no wrangler.toml
const DRIZZLE_CONFIG = process.env.DRIZZLE_CONFIG || "drizzle.config.ts";
const TARGET = (process.env.CMS_TARGET || "local").toLowerCase(); // local | remote

async function codegen() {
  console.log("🧩 [codegen] gerando schema (objeto -> Drizzle)...");
  // seu codegen já deve aceitar --in/--out OU fazer o load de ./cms/resources.ts por padrão
  await run("bun", ["run", "codegen"]);
}

async function drizzleGenerate() {
  console.log("📐 [drizzle] verificando diffs p/ migrações...");
  await run("bunx", ["drizzle-kit", "generate", "--config", DRIZZLE_CONFIG]);
}

async function applyMigrationsLocal() {
  console.log("🗃️  [d1] aplicando migrações no DB local...");
  await run("bunx", ["wrangler", "d1", "migrations", "apply", DB_BINDING, "--local"]);
}

async function applyMigrationsRemote() {
  console.log("🗃️  [d1] aplicando migrações no DB REMOTO...");
  await run("bunx", ["wrangler", "d1", "migrations", "apply", DB_BINDING, "--remote"]);
}

async function resetLocalDbHard() {
  // Estratégia segura em dev:
  // 1) gera uma "drop migration" com drizzle-kit drop
  // 2) aplica no local
  // 3) regenera baseline a partir do schema atual
  // 4) aplica de novo
  console.warn("⚠️  [d1] conflito detectado. Resetando DB LOCAL automaticamente (DROP ALL)...");
  await run("bunx", ["drizzle-kit", "drop", "--config", DRIZZLE_CONFIG]);
  await run("bunx", ["wrangler", "d1", "migrations", "apply", DB_BINDING, "--local"]);
  await drizzleGenerate();
  await applyMigrationsLocal();
  console.log("✅ [d1] reset local concluído e baseline reaplicada.");
}

async function main() {
  console.log(`🔧 CMS sync -> TARGET=${TARGET}`);
  await codegen();
  await drizzleGenerate();

  try {
    if (TARGET === "local") {
      await applyMigrationsLocal();
    } else {
      await applyMigrationsRemote();
    }
    console.log("✨ sync OK.");
  } catch (err: any) {
    const msg = String(err?.message || err);
    // Se for LOCAL, tentamos o reset automático ao detectar erro típico de conflito (tabela já existe / SQLITE_ERROR)
    const canAutoReset =
      TARGET === "local" &&
      (msg.includes("SQLITE_ERROR") ||
        msg.toLowerCase().includes("already exists") ||
        msg.toLowerCase().includes("failed with the following errors"));

    if (canAutoReset) {
      try {
        await resetLocalDbHard();
        console.log("✨ sync OK após reset local.");
        return;
      } catch (e) {
        console.error("❌ Falha ao resetar local:", e);
      }
    }
    // Se chegou aqui, falhou (ou é remoto -> não auto-resetamos por segurança)
    throw err;
  }
}

main().catch((e) => {
  console.error("❌ sync falhou:", e);
  process.exit(1);
});
