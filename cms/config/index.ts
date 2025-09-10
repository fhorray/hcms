import { BuiltOpacaConfig, OpacaConfig } from "../types";
import { sanitize } from "./sanitize";

export const buildOpacaConfig = (rawConfig: OpacaConfig): BuiltOpacaConfig => {
  // Aqui você pode encadear plugins antes/depois do sanitize se quiser
  const cfg = sanitize(rawConfig);

  // Exemplos de invariantes adicionais (opcional):
  // - validar relationships.to com cfg._index.bySlug
  // - checar campos reservados

  return cfg;
}