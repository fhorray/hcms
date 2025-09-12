#!/usr/bin/env node
import { spawn } from "child_process";
import chokidar from "chokidar";
import path from "path";

// Importa sua função de build de schema
import { main as buildSchema } from "@opaca/cli/build-schema";

function runNext() {
  const child = spawn("next", ["dev"], {
    stdio: "inherit",
    shell: true, // garante compatibilidade no Windows
  });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });
}

async function watchCollections() {
  const watcher = chokidar.watch(path.join(process.cwd(), "collections"), {
    ignoreInitial: true,
  });

  watcher.on("all", async () => {
    try {
      await buildSchema();
    } catch (err) {
      console.error("[opaca] schema build failed:", err);
    }
  });

  console.log("[opaca] watching collections/ for changes...");
}

export async function dev() {
  await buildSchema();
  watchCollections();
  runNext();
}

// Detecta comando
const cmd = process.argv[2];
if (cmd === "dev") {
  dev();
} else {
  console.log("Usage: opaca dev");
}
