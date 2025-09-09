import { sanitize } from "./sanitize";
import { OpacaConfig, SanitizedConfig } from "./types";


// Unwrap { default: ... } -> ESM/CJS (Bun, ts-node, transpilers)
function unwrapDefault<T>(maybeModule: unknown): T {
  if (maybeModule && typeof maybeModule === "object" && "default" in (maybeModule as any)) {
    return (maybeModule as any).default as T;
  }
  return maybeModule as T;
}

/**
 * @description Build and validate Opaca CMS config file
 * @param config Opaca Config
 * @returns Built and sanitized Opaca Config
 */
export async function buildConfig(rawConfig: OpacaConfig): Promise<SanitizedConfig> {

  const config = unwrapDefault<unknown>(rawConfig);

  // verify if config is valid if not parse it with Object.values()
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw new Error("Config inválido. Deve ser um objeto.");
  }

  // sanitize config
  const sanitized = sanitize(rawConfig);


  return {
    ...sanitized,
    orm: Array.isArray(sanitized.schema) ? "drizzle" : "prisma",
  }
}