import { OpacaDbAdapter } from "@opaca/db/adapter";
import { OpacaBuiltConfig, OpacaConfig } from "@opaca/types/config";
import { sanitize } from "./sanitize";


export function defineOpacaConfig(cfg: OpacaConfig): OpacaBuiltConfig {
  const sanitized = sanitize(cfg);
  return sanitized;
}