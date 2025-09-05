// Tipos aceitos no MVP
export type FieldType =
  | "text"
  | "boolean"
  | "int"
  | "float"
  | "json"
  | "date"      // ISO string
  | "datetime"  // epoch ms
  | { enum: string[] }
  | { relation: { to: string; kind: "many-to-one" | "one-to-many" | "many-to-many" } };

export type FieldDef = {
  type: FieldType;
  required?: boolean;
  default?: unknown;
  unique?: boolean;
  // index simples
  indexed?: boolean;
  // nome da coluna (opcional, senão vira o nome do campo)
  columnName?: string;
  // FK extra (para many-to-one custom, opcional)
  references?: { table: string; field: string };
};

export type ResourceDef = {
  name: string; // display
  slug: string; // tabela/rota (ex: "posts")
  fields: Record<string, FieldDef>;
  // PK (se não definido, geramos id autoincrement)
  primaryKey?: string; // nome do campo, ex: "id" (int autoinc) ou "uuid"
};

export type ProjectSchema = {
  resources: ResourceDef[];
};
