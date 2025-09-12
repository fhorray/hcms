import fs from "fs";
import path from "path";

export function detectAppDir(root = process.cwd()): string {
  const candidates = ["app", path.join("src", "app")];
  for (const candidate of candidates) {
    const fullPath = path.join(root, candidate);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
      return candidate; // return "app" ou "src/app"
    }
  }
  // fallback: assume "app"
  return "app";
}