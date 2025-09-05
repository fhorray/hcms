import { z } from "zod";

export type Field =
  | { type: "text"; required?: boolean }
  | { type: "boolean"; default?: boolean }
  | { type: "richtext" };

export type CollectionConfig = {
  name: string;                // "posts"
  fields: Record<string, Field>;
};

export function defineCollection(cfg: CollectionConfig) {
  // guarda metadados para o admin
  return cfg;
}
