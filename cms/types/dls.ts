import { LucideIcon } from "lucide-react";
import * as schema from "@/server/db/schema"

// Entrada mais amigável (opções só quando quiser)
export type FieldTypeInput =
  | 'text' | 'boolean' | 'int' | 'float' | 'json' | 'date' | 'datetime' | "richtext"
  | 'email' | 'password' | 'url' | 'uuid' | 'cuid' | 'autoincrement' | 'timestamp'
  | 'textarea' | 'markdown'
  | 'image' | 'file'
  | 'select'
  | { enum: string[] }
  | { relation: { to: keyof typeof schema; many?: boolean; /* through?: string (opcional) */ } };

export type FieldDefInput = {
  type: FieldTypeInput;
  required?: boolean;
  default?: unknown;
  unique?: boolean;
  indexed?: boolean;
  columnName?: string;
  // se quiser forçar, ainda pode:
  references?: { table: string; field: string };
};

export type CollectionInput = {
  name: string;               // "Posts"
  slug?: string;              // default: slugify(plural(name)) -> "posts"
  icon?: LucideIcon; // optional, for admin UI
  fields: Record<string, FieldDefInput | FieldTypeInput>; // aceita shorthand: "text"
  primaryKey?: string;        // default: "id" autoincrement (serial)
};

export type ProjectInput = {
  collections: CollectionInput[];

  // ADD OTHER CONFIGS HERE
};
