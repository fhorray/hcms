#!/usr/bin/env bun
/**
 * cms_codegen.ts — ARQUIVO ÚNICO
 * Transforma um schema-objeto (resources/fields) em Drizzle (sqliteTable).
 * - Suporta: text, boolean (0/1), int, float, json, date(text), datetime(int),
 *   enum (como TEXT), relation many-to-many (gera join table),
 *   FKs via FieldDef.references { table, field }.
 * - Gera chaves corretas (campo: builder...), sem "default(false)()".
 * - CLI: --in <path.ts|js> (export default ProjectSchema), --out <path.ts>
 */

import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import url from "node:url";

/* ===========================
   1) DSL (tipos em runtime)
   =========================== */

type FieldType =
  | "text"
  | "boolean"
  | "int"
  | "float"
  | "json"
  | "date"      // ISO string → TEXT
  | "datetime"  // epoch ms → INTEGER
  | { enum: string[] }
  | { relation: { to: string; kind: "many-to-one" | "one-to-many" | "many-to-many" } };

type FieldDef = {
  type: FieldType;
  required?: boolean;
  default?: unknown;
  unique?: boolean;
  indexed?: boolean;
  columnName?: string;
  // Para many-to-one explícita (FK):
  references?: { table: string; field: string };
};

type CollectionDef = {
  name: string; // display
  slug: string; // nome da tabela
  fields: Record<string, FieldDef>;
  primaryKey?: string; // se omitir, vira "id"
};

type ProjectSchema = {
  resources: CollectionDef[];
};

/* ==========================================
   2) Schema DEMO embutido (pode usar --in)
   ========================================== */

const DEMO: ProjectSchema = {
  resources: [
    {
      name: "Users",
      slug: "users",
      primaryKey: "id",
      fields: {
        id: { type: "int", required: true, unique: true },
        email: { type: "text", required: true, unique: true, indexed: true },
        name: { type: "text" }
      }
    },
    {
      name: "Tags",
      slug: "tags",
      primaryKey: "id",
      fields: {
        id: { type: "int", required: true, unique: true },
        label: { type: { enum: ["tech", "news", "sports"] }, required: true, indexed: true }
      }
    },
    {
      name: "Posts",
      slug: "posts",
      primaryKey: "id",
      fields: {
        id: { type: "int", required: true, unique: true },
        title: { type: "text", required: true, indexed: true },
        content: { type: "text" },
        published: { type: "boolean", default: false },
        authorId: { type: "int", required: true, references: { table: "users", field: "id" }, indexed: true },
        // m2m com tags — gera join table posts_tags
        tags: { type: { relation: { to: "tags", kind: "many-to-many" } } }
      }
    }
  ]
};

/* ===========================
   3) CLI args
   =========================== */

function parseArgs() {
  const argv = process.argv.slice(2);
  const out = { inPath: undefined as string | undefined, outPath: "server/db/schema.generated.ts" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--in") out.inPath = argv[++i];
    else if (a === "--out") out.outPath = argv[++i];
  }
  return out;
}

/* ===========================
   4) Utilitários
   =========================== */

const HEADER =
  `// AUTO-GERADO por codegen.ts — NÃO EDITAR\n` +
  `import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";\n`;

function sqlIdent(s: string) {
  return s.replace(/[^a-zA-Z0-9_]/g, "_");
}

function colName(fieldKey: string, def: FieldDef) {
  return def.columnName ?? fieldKey;
}

function withChain(base: string, chain: string[]) {
  return base + chain.join("");
}

/* ===========================
   5) Mapeamento de coluna
   =========================== */

function buildColumnExpr(fieldKey: string, def: FieldDef, isPrimaryKey: boolean): string | null {
  const cName = colName(fieldKey, def);
  const chain: string[] = [];

  // flags/atributos comuns
  if (def.required) chain.push(".notNull()");
  if (def.unique) chain.push(".unique()");
  if (def.default !== undefined) {
    const v = typeof def.default === "boolean" ? (def.default ? 1 : 0) : def.default;
    chain.push(`.default(${JSON.stringify(v)})`);
  }

  const t = def.type;
  let base: string | null = null;

  if (typeof t === "object" && "enum" in t) base = `text("${cName}")`;              // enum → TEXT
  else if (t === "text" || t === "json" || t === "date") base = `text("${cName}")`;  // json/date → TEXT
  else if (t === "boolean") base = `integer("${cName}")`;                             // boolean → INTEGER (0/1)
  else if (t === "int" || t === "datetime") base = `integer("${cName}")`;            // datetime → INTEGER (epoch)
  else if (t === "float") base = `real("${cName}")`;
  else if (typeof t === "object" && "relation" in t) return null;                    // relation pura não vira coluna
  else base = `text("${cName}")`;                                                    // fallback

  // PK autoincrement quando INTEGER
  if (isPrimaryKey && (t === "int" || t === "datetime")) {
    chain.push(".primaryKey({ autoIncrement: true })");
  }

  // FK explícita
  if (def.references) {
    const refTable = sqlIdent(def.references.table);
    const refField = sqlIdent(def.references.field);
    chain.push(`.references(() => ${refTable}.${refField})`);
  }

  return withChain(base, chain);
}

/* ===========================
   6) Tabelas base
   =========================== */

function buildTable(def: CollectionDef): string {
  const tableName = sqlIdent(def.slug);
  const pkField = def.primaryKey ?? "id";

  const lines: string[] = [];
  const indexedFields: string[] = [];

  for (const [fieldKey, fdef] of Object.entries(def.fields)) {
    const isPK = fieldKey === pkField;
    const expr = buildColumnExpr(fieldKey, fdef, isPK);
    if (!expr) continue;

    lines.push(`  ${fieldKey}: ${expr},`);

    // coleta campos com indexed: true para criar index() depois
    if (fdef.indexed) indexedFields.push(fieldKey);
  }

  // bloco de índices no 3º argumento
  const indexBlock =
    indexedFields.length > 0
      ? `,
  (t) => ({
  ${indexedFields
        .map((f) => `  idx_${tableName}_${f}: index("${tableName}_${f}_idx").on(t.${f})`)
        .join(",\n")}
  })`
      : "";

  const code =
    `export const ${tableName} = sqliteTable("${tableName}", {
  ${lines.join("\n")}
  }${indexBlock});`;

  return code;
}

/* ===========================
   7) Join tables (many-to-many)
   =========================== */

function findM2MPairs(schema: ProjectSchema) {
  const pairs: Array<{ a: string; b: string }> = [];
  for (const col of schema.resources) {
    for (const f of Object.values(col.fields)) {
      if (typeof f.type === "object" && "relation" in f.type && f.type.relation.kind === "many-to-many") {
        const a = sqlIdent(col.slug);
        const b = sqlIdent(f.type.relation.to);
        const key = [a, b].sort().join("__");
        if (!pairs.find((p) => [p.a, p.b].sort().join("__") === key)) {
          pairs.push({ a, b });
        }
      }
    }
  }
  return pairs;
}

function buildJoinTable(a: string, b: string): string {
  const name = `${a}_${b}`;
  return (
    `export const ${name} = sqliteTable("${name}", {
  ${a}_id: integer("${a}_id").notNull(),
  ${b}_id: integer("${b}_id").notNull()
}); // TODO: criar unique index composto (${a}_id, ${b}_id) via migration`
  );
}

/* ===========================
   8) Carregar schema (CLI)
   =========================== */

async function loadProjectFromArg(inPath?: string): Promise<ProjectSchema> {
  if (!inPath) {
    console.log("ℹ️  Usando schema DEMO embutido (passe --in ./cms/resources.ts para usar o seu).");
    return DEMO;
  }

  const abs = path.resolve(process.cwd(), inPath);
  const href = url.pathToFileURL(abs).href;
  console.log("➡️  Importando schema de:", abs);

  const mod = await import(href);
  const project: ProjectSchema | undefined = (mod.default ?? mod.project ?? mod.schema) as any;

  if (!project) throw new Error("Export default (ou 'project'/'schema') não encontrado.");
  if (!Array.isArray(project.resources)) throw new Error("Propriedade 'resources' ausente/ inválida.");
  console.log(`✅ resources carregadas: ${project.resources.length}`);
  return project;
}

/* ===========================
   9) Main
   =========================== */

async function main() {
  const { inPath, outPath } = parseArgs();
  const project = await loadProjectFromArg(inPath);

  if (project.resources.length === 0) {
    console.warn("⚠️  Nenhuma collection definida. Gerando arquivo com cabeçalho apenas.");
    if (!existsSync(path.dirname(outPath))) {
      await mkdir(path.dirname(outPath), { recursive: true });
    }
    await writeFile(outPath, HEADER + `\n// Nenhuma collection encontrada.\n`, "utf8");
    console.log("✔ Arquivo gerado:", outPath);
    return;
  }

  const tables: string[] = [];
  for (const c of project.resources) {
    tables.push(buildTable(c));
  }

  const m2m = findM2MPairs(project);
  for (const p of m2m) {
    tables.push(buildJoinTable(p.a, p.b));
  }

  const body = HEADER + "\n" + tables.join("\n\n") + "\n";
  if (!existsSync(path.dirname(outPath))) {
    await mkdir(path.dirname(outPath), { recursive: true });
  }
  await writeFile(outPath, body, "utf8");
  console.log("✔ schema gerado em", outPath);
}

main().catch((e) => {
  console.error("❌ Erro no codegen:", e);
  process.exit(1);
});
