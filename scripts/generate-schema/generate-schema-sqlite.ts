// scripts/generate-schema.sqlite.ts
import { writeFileSync } from 'node:fs';
import schema from '@/cms/collections';

// ---------- helpers ----------
const slugify = (s: string) =>
  s.trim().toLowerCase()
    .replace(/[\s\-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/^_+|_+$/g, '');

const tableVar = (slug: string) => slug;

// ---------- type guards & normalização ----------
const isEnumLike = (x: any): x is { enum: string[] } =>
  x && typeof x === 'object' && 'enum' in x;

const isRelationLike = (x: any): x is { relation: { to: string; many?: boolean } } =>
  x && typeof x === 'object' && 'relation' in x;

function normalizeFieldDef(fieldName: string, raw: any) {
  if (typeof raw === 'string') return { type: raw };
  if (isEnumLike(raw)) return { type: { enum: raw.enum } };
  if (isRelationLike(raw)) return { type: { relation: { to: slugify(raw.relation.to), many: !!raw.relation.many } } };
  if (raw && typeof raw === 'object') {
    if ('type' in raw) {
      const t = (raw as any).type;
      if (typeof t === 'string') return raw;
      if (isEnumLike(t)) return { ...raw, type: { enum: t.enum } };
      if (isRelationLike(t)) return { ...raw, type: { relation: { to: slugify(t.relation.to), many: !!t.relation.many } } };
    }
    return raw;
  }
  throw new Error(`Campo '${fieldName}' inválido: ${JSON.stringify(raw)}`);
}

const isNormalizedEnum = (t: any): t is { enum: string[] } => isEnumLike(t);
const isNormalizedRelation = (t: any): t is { relation: { to: string; many?: boolean } } =>
  t && typeof t === 'object' && 'relation' in t;

// ---------- geração ----------
let out =
  `import { sqliteTable, integer, text, real, index, uniqueIndex, primaryKey } from 'drizzle-orm/sqlite-core';\n` +
  `import { createId } from '@paralleldrive/cuid2';\n` +
  `import { sql } from 'drizzle-orm';\n\n`;

type Coll = { name: string; slug?: string; primaryKey?: string; fields: Record<string, any>; };
const collections: Coll[] = (schema as any).collections ?? [];
if (!Array.isArray(collections)) {
  throw new Error('collections.default precisa exportar { collections: [...] }');
}

const pkByTable = new Map<string, string>();
const joinTables: string[] = [];

// 1) slugs e PKs
const collMeta = collections.map((c) => {
  const slug = c.slug ? slugify(c.slug) : slugify(c.name);
  const pk = c.primaryKey ?? 'id';
  pkByTable.set(slug, pk);
  return { ...c, slug, pk };
});

// ---------- coluna (SQLite mapeamento) ----------
function emitColumn(fieldName: string, rawCfg: any, table: string): string | null {
  const cfg = normalizeFieldDef(fieldName, rawCfg);
  const col = (cfg as any).columnName ?? fieldName;

  // relation -> FK/join depois
  if (isNormalizedRelation(cfg.type)) return null;

  // defaults comuns
  const notNull = (cfg as any).required ? '.notNull()' : '';

  // enum inline no text()
  if (isNormalizedEnum(cfg.type)) {
    const def =
      (cfg as any).default !== undefined
        ? `.default(${JSON.stringify((cfg as any).default)})`
        : '';
    return `${col}: text('${col}', { enum: ${JSON.stringify(cfg.type.enum)} })${notNull}${def}`;
  }

  const t = cfg.type as string | undefined;

  // defaults específicos
  const rawDefault = (cfg as any).default;
  const defaultSqlForNow = (expr: string) => `.default(sql\`${expr}\`)`;
  let def = '';
  if (rawDefault !== undefined) {
    if (rawDefault === 'now' && t === 'datetime') {
      // epoch ms em D1/SQLite
      def = defaultSqlForNow('(unixepoch() * 1000)');
    } else if (typeof rawDefault === 'boolean') {
      // boolean em sqlite = integer 0/1
      def = `.default(${rawDefault ? true : false})`;
    } else {
      def = `.default(${JSON.stringify(rawDefault)})`;
    }
  }

  switch (t) {
    case 'int': return `${col}: integer('${col}')${notNull}${def}`;
    case 'float': return `${col}: real('${col}')${notNull}${def}`;
    case 'text': return `${col}: text('${col}')${notNull}${def}`;
    case 'boolean': return `${col}: integer('${col}', { mode: 'boolean' })${notNull}${def}`;
    case 'json': return `${col}: text('${col}')${notNull}${def}`; // JSON como TEXT (stringificado)
    case 'date': return `${col}: text('${col}')${notNull}${def}`; // ISO string
    case 'datetime': return `${col}: integer('${col}', { mode: 'timestamp' })${notNull}${def}`; // epoch ms
    default:
      throw new Error(`Tipo não suportado em '${fieldName}': ${t}`);
  }
}

// 2) tabelas base
for (const c of collMeta) {
  const table = tableVar(c.slug);

  // colunas + índices
  const cols: string[] = [];
  const indexExprs: string[] = [];

  // PK implícita se o usuário não declarou o campo PK
  const hasPkField = Object.prototype.hasOwnProperty.call(c.fields, c.pk);
  if (!hasPkField) {
    cols.push(
      `${c.pk}: text('${c.pk}')
        .primaryKey()
        .$defaultFn(() => createId())`
    );
  }

  // colunas simples (primitivos + enum inline em text())
  for (const [fname, raw] of Object.entries<any>(c.fields)) {
    const emitted = emitColumn(fname, raw, table);
    if (emitted) cols.push(emitted);
  }

  // relações many-to-one: cria <fieldName>Id + FK + index
  for (const [fname, raw] of Object.entries<any>(c.fields)) {
    const f = normalizeFieldDef(fname, raw);
    if (isNormalizedRelation(f.type) && !f.type.relation.many) {
      const to = tableVar(slugify(f.type.relation.to));
      const targetPk = pkByTable.get(to) ?? 'id';
      const fkCol = `${fname}Id`;
      cols.push(
        `${fkCol}: integer('${fkCol}').notNull().references(() => ${to}.${targetPk}, { onDelete: 'cascade' })`
      );
      const idxName = `${table}_${fkCol}_idx`;
      indexExprs.push(`index('${idxName}').on(t.${fkCol})`);
    }
  }

  // índices/uniques declarados pelo usuário (usar t.<col> sempre!)
  for (const [fname, raw] of Object.entries<any>(c.fields)) {
    const f = normalizeFieldDef(fname, raw);
    const colName = (f as any).columnName ?? fname;

    if ((f as any).indexed) {
      const idxName = `${table}_${colName}_idx`;
      indexExprs.push(`index('${idxName}').on(t.${colName})`);
    }
    if ((f as any).unique && c.pk !== fname) {
      const uqName = `${table}_${colName}_uniq`;
      indexExprs.push(`uniqueIndex('${uqName}').on(t.${colName})`);
    }
  }

  // sqliteTable (callback com ARRAY evita self-reference e TS-7022)
  out += `export const ${table} = sqliteTable('${table}', {\n  ${cols.join(',\n  ')}\n}${indexExprs.length ? `, (t) => [\n  ${indexExprs.join(',\n  ')}\n]` : ''
    });\n\n`;
}

// 3) join tables (many-to-many)
for (const c of collMeta) {
  const table = tableVar(c.slug);
  for (const [fname, raw] of Object.entries<any>(c.fields)) {
    const f = normalizeFieldDef(fname, raw);
    if (isNormalizedRelation(f.type) && !!f.type.relation.many) {
      const to = tableVar(slugify(f.type.relation.to));
      const leftPk = pkByTable.get(table) ?? 'id';
      const rightPk = pkByTable.get(to) ?? 'id';
      const jt = `${table}_${to}`;
      joinTables.push(
        `export const ${jt} = sqliteTable('${jt}', {
  ${table}Id: integer('${table}_id').notNull().references(() => ${table}.${leftPk}, { onDelete: 'cascade' }),
  ${to}Id: integer('${to}_id').notNull().references(() => ${to}.${rightPk}, { onDelete: 'cascade' }),
}, (t) => [
  primaryKey({ columns: [t.${table}Id, t.${to}Id] })
]);\n`
      );
    }
  }
}

// 4) anexar join tables e escrever
out += joinTables.join('\n');
writeFileSync('server/db/schema.ts', out);
