// scripts/generate-schema.ts
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

// ---------- emissor de coluna ----------
function emitColumn(fieldName: string, rawCfg: any, table: string): string | null {
  const cfg = normalizeFieldDef(fieldName, rawCfg);
  const col = (cfg as any).columnName ?? fieldName;

  // relation -> não gera aqui (FK/join mais abaixo)
  if (isNormalizedRelation(cfg.type)) return null;

  // enum -> usa pgEnum <tabela>_<col>
  if (isNormalizedEnum(cfg.type)) {
    const enumName = `enum_${table}_${col}`;
    const notNull = (cfg as any).required ? '.notNull()' : '';
    const def =
      (cfg as any).default !== undefined
        ? `.default(${typeof (cfg as any).default === 'string' ? `'${(cfg as any).default}'` : (cfg as any).default})`
        : '';
    return `${col}: ${enumName}('${col}')${notNull}${def}`;
  }

  const t = cfg.type as string | undefined;
  const notNull = (cfg as any).required ? '.notNull()' : '';
  const def =
    (cfg as any).default !== undefined
      ? `.default(${typeof (cfg as any).default === 'string' ? `'${(cfg as any).default}'` : (cfg as any).default})`
      : '';

  switch (t) {
    case 'int': return `${col}: integer('${col}')${notNull}${def}`;
    case 'float': return `${col}: doublePrecision('${col}')${notNull}${def}`;
    case 'text': return `${col}: text('${col}')${notNull}${def}`;
    case 'boolean': return `${col}: boolean('${col}')${notNull}${def}`;
    case 'json': return `${col}: jsonb('${col}')${notNull}${def}`;
    case 'date': return `${col}: date('${col}', { mode: 'date' })${notNull}${def}`;
    case 'datetime': return `${col}: timestamp('${col}', { withTimezone: true })${(cfg as any).default === 'now' ? '.defaultNow()' : def}${notNull}`;
    default:
      throw new Error(`Tipo não suportado em '${fieldName}': ${t}`);
  }
}

// ---------- geração ----------
let headerImports = new Set([
  'pgTable', 'serial', 'integer', 'text', 'boolean', 'jsonb', 'timestamp', 'date',
  'doublePrecision', 'pgEnum', 'primaryKey', 'index', 'uniqueIndex'
]);

let out = `import { ${Array.from(headerImports).sort().join(', ')} } from 'drizzle-orm/pg-core';\n\n` + `import { createId } from '@paralleldrive/cuid2';\n`;

type Coll = { name: string; slug?: string; primaryKey?: string; fields: Record<string, any>; };
const collections: Coll[] = (schema as any).collections ?? [];
if (!Array.isArray(collections)) {
  throw new Error('collections.default precisa exportar { collections: [...] }');
}

const pkByTable = new Map<string, string>();
const joinTables: string[] = [];
const declaredEnums = new Set<string>();

// 1) slugs e PKs
const collMeta = collections.map((c) => {
  const slug = c.slug ? slugify(c.slug) : slugify(c.name);
  const pk = c.primaryKey ?? 'id';
  pkByTable.set(slug, pk);
  return { ...c, slug, pk };
});

// 2) tabelas base
for (const c of collMeta) {
  const table = tableVar(c.slug);

  // declarar enums dessa tabela (dedupe)
  const enumDecls: Array<{ name: string; values: string[] }> = [];
  for (const [fname, raw] of Object.entries<any>(c.fields)) {
    const f = normalizeFieldDef(fname, raw);
    if (isNormalizedEnum(f.type)) {
      const enumName = `enum_${table}_${(f as any).columnName ?? fname}`;
      if (!declaredEnums.has(enumName)) {
        enumDecls.push({ name: enumName, values: f.type.enum });
        declaredEnums.add(enumName);
      }
    }
  }
  for (const e of enumDecls) {
    out += `const ${e.name} = pgEnum('${e.name}', ${JSON.stringify(e.values)});\n`;
  }
  if (enumDecls.length) out += `\n`;

  // colunas
  const cols: string[] = [];
  const indexExprs: string[] = []; // EXPRESSÕES que serão colocadas no array do callback (t) => [ ... ]

  // PK implícita
  const hasPkField = Object.prototype.hasOwnProperty.call(c.fields, c.pk);
  if (!hasPkField) {
    cols.push(`${c.pk}: text('${c.pk}')
        .primaryKey()
        .$defaultFn(() => createId())`);
  }

  // colunas primitivas/enums
  for (const [fname, raw] of Object.entries<any>(c.fields)) {
    const emitted = emitColumn(fname, raw, table);
    if (emitted) cols.push(emitted);
  }

  // relações many-to-one: cria <fieldName>Id + FK e já indexa com t.<fk>
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

  // índices declarados pelo usuário (usar t.<col> aqui!)
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

  // pgTable (callback retorna ARRAY para evitar nomear props e, principalmente, evitar referenciar a const da tabela)
  out += `export const ${table} = pgTable('${table}', {\n  ${cols.join(',\n  ')}\n}${indexExprs.length ? `, (t) => [\n  ${indexExprs.join(',\n  ')}\n]` : ''
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
        `export const ${jt} = pgTable('${jt}', {
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
