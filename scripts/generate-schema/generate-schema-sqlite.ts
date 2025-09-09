// scripts/generate-schema.sqlite.ts
// -------------------------------------------------------------
// Gera o schema do Drizzle (SQLite por padrão) a partir de um
// config estilo Payload definido em '@/cms/collections'.
//
// Correções importantes:
// 1) Suporte a relationship: aceita 'relationship', 'relation' e 'relationTo'.
//    - Campos de relação NÃO geram coluna direta; em vez disso:
//      * 1:N → cria '<fieldName>Id' com FK para a tabela alvo.
//      * N:N → cria tabela de junção '<tabela>_<tabelaDestino>'.
// 2) Evita erro do SQLite ao adicionar coluna NOT NULL sem DEFAULT:
//    - Flag opcional CMS_SQLITE_SAFE_NOTNULL=true torna colunas novas de relação
//      NULLABLE no SQLite quando não houver DEFAULT, permitindo migrar e depois
//      fazer backfill + promover para NOT NULL.
// 3) Datas: armazenadas como epoch ms (INTEGER) no SQLite. 'default: "now"'
//    gera default SQL (unixepoch()*1000) em SQLite, now() em Postgres.
// -------------------------------------------------------------

import { writeFileSync } from 'node:fs';
import schema from '@/cms/collections';
import { slugify } from '@/lib/utils';
import dotenv from 'dotenv';
dotenv.config({ path: '.dev.vars' });

// Helpers de dialeto
// -------------------------------------------------------------
export type Dialect = 'sqlite' | 'pg';
const DIALECT: Dialect = (process.env.CMS_DB as Dialect) ?? 'sqlite';
const SQLITE_SAFE_NOTNULL = String(process.env.CMS_SQLITE_SAFE_NOTNULL ?? 'false').toLowerCase() === 'true';

// Tipagem base "payload-like" → PrimitiveTag
// -------------------------------------------------------------
export type PrimitiveTag =
  | 'skip'        // estrutural/não-coluna (Array, Blocks, Group, Row, Tabs, UI, Collapsible, Join, Relationship)
  | 'text'        // Text, Email, URL, Password, Code, Markdown, Textarea, Select, RadioGroup
  | 'int'         // Number (modo int)
  | 'real'        // Number (modo float)
  | 'bool'        // Checkbox/Switch
  | 'timestamp'   // Date/DateTime (epoch ms no SQLite)
  | 'json'        // JSON / RichText → TEXT no SQLite
  | 'point';      // GeoJSON → TEXT no SQLite

const getNumberMode = (cfg: any): 'int' | 'real' =>
  cfg?.mode === 'int' ? 'int' : cfg?.mode === 'float' ? 'real' : 'real';

function payloadTypeToPrimitiveTag(t: string): PrimitiveTag {
  const k = t.replace(/\s+/g, '').toLowerCase();
  switch (k) {
    // não-colunas
    case 'array':
    case 'blocks':
    case 'group':
    case 'row':
    case 'tabs':
    case 'ui':
    case 'collapsible':
    case 'join':
    case 'relationship':
      return 'skip';

    // texto
    case 'text':
    case 'email':
    case 'url':
    case 'password':
    case 'code':
    case 'markdown':
    case 'textarea':
    case 'select':
    case 'radiogroup':
      return 'text';

    // number
    case 'number':
      return 'real';

    // boolean
    case 'checkbox':
    case 'switcher':
      return 'bool';

    // datas
    case 'date':
    case 'datetime':
      return 'timestamp';

    // json e rich-text
    case 'json':
    case 'richtext':
      return 'json';

    // ponto (GeoJSON)
    case 'point':
      return 'point';

    default:
      return 'text';
  }
}

// Conversão PrimitiveTag → construtor Drizzle por dialeto
// -------------------------------------------------------------
function primitiveToDrizzle(
  tag: PrimitiveTag,
  col: string,
  dialect: Dialect,
  opts?: {
    notNull?: boolean;
    defSql?: string;
    defLit?: unknown;
    enumVals?: string[];
    numberMode?: 'int' | 'real';
  }
): string {
  const notNull = opts?.notNull ? '.notNull()' : '';
  const def = opts?.defSql
    ? `.default(sql\`${opts.defSql}\`)`
    : opts?.defLit !== undefined
      ? `.default(${JSON.stringify(opts.defLit)})`
      : '';
  const enumArg = opts?.enumVals && opts.enumVals.length ? `, { enum: ${JSON.stringify(opts.enumVals)} }` : '';

  if (dialect === 'sqlite') {
    switch (tag) {
      case 'text':
        return `${col}: text('${col}'${enumArg})${notNull}${def}`;
      case 'bool':
        return `${col}: integer('${col}', { mode: 'boolean' })${notNull}${def}`;
      case 'int':
        return `${col}: integer('${col}')${notNull}${def}`;
      case 'real':
        return `${col}: real('${col}')${notNull}${def}`;
      case 'timestamp':
        return `${col}: integer('${col}')${notNull}${def}`; // epoch ms
      case 'json':
        return `${col}: text('${col}')${notNull}${def}`; // TEXT stringificado
      case 'point':
        return `${col}: text('${col}')${notNull}${def}`;
      case 'skip':
      default:
        return '';
    }
  } else {
    // Postgres
    switch (tag) {
      case 'text':
        return `${col}: text('${col}')${notNull}${def}`;
      case 'bool':
        return `${col}: boolean('${col}')${notNull}${def}`;
      case 'int':
        return `${col}: integer('${col}')${notNull}${def}`;
      case 'real':
        return `${col}: real('${col}')${notNull}${def}`;
      case 'timestamp':
        return `${col}: timestamp('${col}', { withTimezone: false })${notNull}${def}`;
      case 'json':
        return `${col}: jsonb('${col}')${notNull}${def}`;
      case 'point':
        return `${col}: jsonb('${col}')${notNull}${def}`;
      case 'skip':
      default:
        return '';
    }
  }
}

// Guard/normalizers
// -------------------------------------------------------------
const tableVar = (slug: string) => slug;

const isEnumLike = (x: any): x is { enum: string[] } =>
  x && typeof x === 'object' && 'enum' in x;

const isRelationLike = (x: any): x is {
  relationship?: { to: string; many?: boolean };
  relation?: { to: string; many?: boolean };
  relationTo?: string | string[];
} => x && typeof x === 'object' && ('relationship' in x || 'relation' in x || 'relationTo' in x);

function normalizeFieldDef(fieldName: string, raw: any) {
  // Ex.: 'text' → { type: 'text' }
  if (typeof raw === 'string') return { type: raw };

  // Enum curto → { type: { enum: [...] } }
  if (isEnumLike(raw)) return { type: { enum: raw.enum } };

  // Relationship compatível com variações
  if (isRelationLike(raw)) {
    const baseRel = (raw as any).relationship ?? (raw as any).relation ?? {};
    const toVal = baseRel.to ?? (raw as any).relationTo;
    if (!toVal) throw new Error(`Field '${fieldName}': relação sem 'to'/'relationTo'`);
    const to = Array.isArray(toVal) ? toVal[0] : toVal; // simplificação para relação polimórfica
    return {
      ...raw,
      type: { relation: { to: slugify(to), many: !!baseRel.many } },
    };
  }

  // Já é objeto com 'type'
  if (raw && typeof raw === 'object') {
    if ('type' in raw) return raw;
    return { ...raw };
  }

  throw new Error(`Field '${fieldName}' inválido: ${JSON.stringify(raw)}`);
}

const isNormalizedEnum = (t: any): t is { enum: string[] } => isEnumLike(t);
const isNormalizedRelation = (t: any): t is { relation: { to: string; many?: boolean } } =>
  t && typeof t === 'object' && 'relation' in t;

// Util para NOT NULL seguro no SQLite em migrações incrementais
function notNullMaybe(required: boolean, hasDefault: boolean): boolean {
  if (!required) return false;
  if (DIALECT !== 'sqlite') return true;
  if (hasDefault) return true; // DEFAULT permite ADD COLUMN NOT NULL
  // Se a flag estiver ativa, evitamos .notNull() para passar a migração (fazer backfill depois)
  return !SQLITE_SAFE_NOTNULL;
}

// Cabeçalho do arquivo gerado
// -------------------------------------------------------------
let out =
  `import { sqliteTable, integer, text, real, index, uniqueIndex, primaryKey } from 'drizzle-orm/sqlite-core';\n` +
  `import { init } from '@paralleldrive/cuid2';\n` +
  `import { sql } from 'drizzle-orm';\n\n`;

// Tipos da collection
export type Coll = {
  name: string;
  slug?: string;
  primaryKey?: string;
  fields: Record<string, any>;
};

const collections: Coll[] = (schema as any).collections ?? [];
if (!Array.isArray(collections)) {
  throw new Error('collections.default precisa exportar { collections: [...] }');
}

const pkByTable = new Map<string, { name: string; type: 'text' | 'integer' }>();
const joinTables: string[] = [];

const collMeta = collections.map((c) => {
  const slug = c.slug ? slugify(c.slug) : slugify(c.name);
  const pk = c.primaryKey ?? 'id';
  pkByTable.set(slug, { name: pk, type: 'text' }); // default cuid/text
  return { ...c, slug, pk };
});

// Emissão de coluna normal (não-relação)
// -------------------------------------------------------------
function emitColumn(fieldName: string, rawCfg: any, table: string): string | null {
  const cfg = normalizeFieldDef(fieldName, rawCfg);
  const col = (cfg as any).columnName ?? fieldName;

  // relações são tratadas em outra etapa
  if (isNormalizedRelation(cfg.type)) return null;

  const required = !!(cfg as any).required;

  // enum inline
  let enumVals: string[] | undefined;
  if (isNormalizedEnum(cfg.type)) enumVals = cfg.type.enum;

  // tipo payload-like
  const rawType: string | undefined = isNormalizedEnum(cfg.type) ? 'Select' : (cfg.type as string | undefined);

  // defaults
  const rawDefault = (cfg as any).default;
  let defSql: string | undefined;
  let defLit: unknown | undefined;

  if (rawDefault !== undefined) {
    if (typeof rawDefault === 'string' && rawDefault.toLowerCase() === 'now') {
      defSql = DIALECT === 'sqlite' ? '(unixepoch() * 1000)' : 'now()';
    } else {
      defLit = rawDefault;
    }
  }

  // tipo primitivo
  let prim: PrimitiveTag;
  if (isNormalizedEnum(cfg.type)) {
    prim = 'text';
  } else if (typeof rawType === 'string') {
    prim = payloadTypeToPrimitiveTag(rawType);
  } else {
    prim = 'text';
  }

  // Number → int/real
  let numberMode: 'int' | 'real' | undefined;
  if (prim === 'real' && (rawType?.toLowerCase().replace(/\s+/g, '') === 'number')) {
    numberMode = getNumberMode(cfg);
    prim = numberMode; // 'int' | 'real'
  }

  const makeNotNull = notNullMaybe(required, !!(defSql || (defLit !== undefined)));

  const colDecl = primitiveToDrizzle(prim, col, DIALECT, {
    notNull: makeNotNull,
    defSql,
    defLit,
    enumVals,
    numberMode,
  });

  return colDecl || null;
}

// Tabelas base
// -------------------------------------------------------------
for (const c of collMeta) {
  const table = tableVar(c.slug);
  const cols: string[] = [];
  const indexExprs: string[] = [];

  const hasPkField = Object.prototype.hasOwnProperty.call(c.fields, c.pk);
  if (!hasPkField) {
    cols.push(
      `${c.pk}: text('${c.pk}').primaryKey().notNull().$defaultFn(() => init({ length: 10 })())`
    );
  }

  // Colunas "comuns"
  for (const [fname, raw] of Object.entries<any>(c.fields)) {
    const emitted = emitColumn(fname, raw, table);
    if (emitted) cols.push(emitted);
  }

  // FK 1:N (many=false)
  for (const [fname, raw] of Object.entries<any>(c.fields)) {
    const f = normalizeFieldDef(fname, raw);
    if (isNormalizedRelation(f.type) && !f.type.relation.many) {
      const to = tableVar(slugify(f.type.relation.to));
      const targetPk = pkByTable.get(to) ?? { name: 'id', type: 'text' };
      const fkCol = `${fname}Id`;

      // required/DEFAULT
      const required = !!(f as any).required;
      const rawDefault = (f as any).default;
      const hasDefault = rawDefault !== undefined;

      // .notNull() seguro p/ SQLite se permitido
      const addNotNull = notNullMaybe(required, hasDefault);
      const notNullStr = addNotNull ? '.notNull()' : '';

      const defStr = hasDefault
        ? (typeof rawDefault === 'string'
          ? `.default(${JSON.stringify(rawDefault)})`
          : `.default(${JSON.stringify(rawDefault)})`)
        : '';

      cols.push(
        `${fkCol}: ${targetPk.type}('${fkCol}')${notNullStr}.references(() => ${to}.${targetPk.name}, { onDelete: 'cascade' })${defStr}`
      );
      indexExprs.push(`index('${table}_${fkCol}_idx').on(t.${fkCol})`);
    }
  }

  // Índices/uniques manuais
  for (const [fname, raw] of Object.entries<any>(c.fields)) {
    const f = normalizeFieldDef(fname, raw);
    const colName = (f as any).columnName ?? fname;

    // não indexe campos de relação aqui; já indexamos o FK acima
    if (isNormalizedRelation(f.type)) continue;

    if ((f as any).indexed) indexExprs.push(`index('${table}_${colName}_idx').on(t.${colName})`);
    if ((f as any).unique && c.pk !== fname) indexExprs.push(`uniqueIndex('${table}_${colName}_uniq').on(t.${colName})`);
  }

  out += `export const ${table} = sqliteTable('${table}', {\n  ${cols.join(',\n  ')}\n}` + (indexExprs.length ? `, (t) => [\n  ${indexExprs.join(',\n  ')}\n]` : '') + `);\n\n`;
}

// Tabelas de junção N:N
// -------------------------------------------------------------
for (const c of collMeta) {
  const table = tableVar(c.slug);
  for (const [fname, raw] of Object.entries<any>(c.fields)) {
    const f = normalizeFieldDef(fname, raw);
    if (isNormalizedRelation(f.type) && f.type.relation.many) {
      const to = tableVar(slugify(f.type.relation.to));
      const leftPk = pkByTable.get(table) ?? { name: 'id', type: 'text' };
      const rightPk = pkByTable.get(to) ?? { name: 'id', type: 'text' };
      const jt = `${table}_${to}`;

      const joinDecl = `export const ${jt} = sqliteTable('${jt}', {\n  ${table}Id: ${leftPk.type}('${table}_id').notNull().references(() => ${table}.${leftPk.name}, { onDelete: 'cascade' }),\n  ${to}Id: ${rightPk.type}('${to}_id').notNull().references(() => ${to}.${rightPk.name}, { onDelete: 'cascade' }),\n}, (t) => [\n  primaryKey({ columns: [t.${table}Id, t.${to}Id] })\n]);\n`;

      joinTables.push(joinDecl);
    }
  }
}

out += joinTables.join('\n');

writeFileSync('server/db/schema.ts', out);

// ---------------------------
// Exemplo de uso/observações:
// - Defina CMS_DB=sqlite (padrão) ou pg.
// - Opcional: CMS_SQLITE_SAFE_NOTNULL=true para permitir migrações em bases já preenchidas,
//   evitando o erro "Cannot add a NOT NULL column with default value NULL".
//   Depois faça backfill e promova para NOT NULL via migration manual se necessário.
// - O campo { type: 'date', default: 'now' } gera default epoch ms no SQLite.
// - Campos de relação 'user: { relationship: { to: "users" }, required: true }'
//   viram 'userId' + FK. Para N:N use 'many: true'.
