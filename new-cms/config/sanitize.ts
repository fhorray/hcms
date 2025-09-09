// new-cms/config/sanitize.ts
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { getTableName } from 'drizzle-orm'
import type { ZodTypeAny, ZodObject } from 'zod'
import { z } from 'zod'

import type {
  OpacaConfig,
  SanitizedConfig,
  FieldKind,
  FieldShapeMeta,
  ColumnMeta,
  Collection,
  CmsMap,
  CmsJsonMap,
} from './types'

function looksLikePrismaClient(x: unknown): boolean {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return typeof o['$connect'] === 'function' || typeof o['$use'] === 'function'
}

function isDrizzleTable(x: unknown): boolean {
  try {
    return !!getTableName(x as any)
  } catch {
    return false
  }
}

// ---------- Zod helpers (iguais à sua builder) ----------
function unwrapZod(ztype: ZodTypeAny): {
  base: ZodTypeAny
  optional: boolean
  nullable: boolean
  hasDefault: boolean
  enumValues?: readonly string[]
} {
  let cur: ZodTypeAny = ztype
  let optional = false
  let nullable = false
  let hasDefault = false
  let enumValues: readonly string[] | undefined

  while (cur) {
    const def: any = (cur as any)?._def
    if (!def) break

    if (def.type === 'default') {
      hasDefault = true
      cur = def.innerType
      continue
    }
    if (def.type === 'optional') {
      optional = true
      cur = def.innerType
      continue
    }
    if (def.type === 'nullable') {
      nullable = true
      cur = def.innerType
      continue
    }
    if (def.type === 'pipe') {
      cur = def.out
      continue
    }
    if (def.type === 'enum') {
      enumValues = def.values ?? def.options
      break
    }
    break
  }

  return { base: cur, optional, nullable, hasDefault, enumValues }
}

function guessFieldKindFromZod(ztype: ZodTypeAny): FieldKind {
  const def: any = (ztype as any)?._def
  if (!def) return 'unknown'
  switch (def.type) {
    case 'string':
      return 'string'
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    case 'date':
      return 'date'
    case 'enum':
      return 'enum'
    case 'any':
      return 'json'
    case 'unknown':
      return 'unknown'
    case 'pipe':
      return guessFieldKindFromZod(def.out)
    case 'nullable':
    case 'optional':
      return guessFieldKindFromZod(def.innerType)
    default:
      return 'unknown'
  }
}

function shapeToFieldShapeMeta(
  shape: Record<string, ZodTypeAny>,
): Record<string, FieldShapeMeta> {
  const out: Record<string, FieldShapeMeta> = {}
  for (const [name, ztype] of Object.entries(shape)) {
    const { optional, nullable, hasDefault, enumValues } = unwrapZod(ztype)
    out[name] = {
      kind: guessFieldKindFromZod(ztype),
      optional,
      nullable,
      hasDefault,
      enumValues,
    }
  }
  return out
}

function shapeToColumnMeta(
  shape: Record<string, ZodTypeAny>,
  tableName: string,
): { map: Record<string, ColumnMeta>; list: ColumnMeta[] } {
  const map: Record<string, ColumnMeta> = {}
  const list: ColumnMeta[] = []

  Object.keys(shape).forEach((name, i) => {
    const ztype = shape[name]
    const { optional, nullable, hasDefault, enumValues } = unwrapZod(ztype)
    const kind = guessFieldKindFromZod(ztype)

    const meta: ColumnMeta = {
      name,
      kind,
      isNullable: optional || nullable,
      isPrimaryKey: false, // pode marcar via override se quiser (MVP deixa false)
      hasDefault,
      enumValues,
      order: i,
    }
    map[name] = meta
    list.push(meta)
  })

  return { map, list }
}

function buildFieldStats(fields: ColumnMeta[]) {
  const kinds: Record<FieldKind, number> = {
    string: 0,
    number: 0,
    boolean: 0,
    date: 0,
    json: 0,
    enum: 0,
    blob: 0,
    unknown: 0,
  }
  let optionalCount = 0
  for (const f of fields) {
    kinds[f.kind] = (kinds[f.kind] ?? 0) + 1
    if (f.isNullable) optionalCount++
  }
  return {
    fieldCount: fields.length,
    requiredCount: fields.length - optionalCount,
    optionalCount,
    kinds,
  }
}

// ---------- Drizzle: transforma schema (array|obj) em objeto {key: table} ----------
function normalizeDrizzleSchemaToObject(s: any): Record<string, any> {
  if (Array.isArray(s)) {
    const out: Record<string, any> = {}
    for (const t of s) {
      if (!isDrizzleTable(t)) continue
      const key = getTableName(t)
      out[key] = t
    }
    return out
  }
  if (s && typeof s === 'object') {
    return s as Record<string, any>
  }
  return {}
}

// ---------- Drizzle CMS builder (resumido) ----------
function buildDrizzleCms(schemaObj: Record<string, any>) {
  const cms: CmsMap = {}
  const collections: Collection[] = []

  for (const [exportKey, value] of Object.entries(schemaObj)) {
    if (!isDrizzleTable(value)) continue
    const table = value
    const tableName = getTableName(table)

    const insertZ = createInsertSchema(table)
    const selectZ = createSelectSchema(table)

    const insertShape = (insertZ as unknown as ZodObject<any>).shape
    const selectShape = (selectZ as unknown as ZodObject<any>).shape

    const updateZ = z.object(insertShape).partial()

    const { map: columns, list: fields } = shapeToColumnMeta(selectShape, tableName)
    const shape = {
      insert: shapeToFieldShapeMeta(insertShape),
      select: shapeToFieldShapeMeta(selectShape),
      update: shapeToFieldShapeMeta(updateZ.shape),
    }
    const stats = buildFieldStats(fields)

    cms[exportKey] = {
      tableName,
      insert: insertZ,
      select: selectZ,
      update: updateZ,
      columns,
      fields,
      shape,
      stats,
    }

    collections.push({
      slug: exportKey,
      label: exportKey,
      tableName,
      fields, // JSON-safe (ColumnMeta[])
    })
  }

  // cmsJson: remova os Zod para ficar serializável
  const cmsJson: CmsJsonMap = Object.fromEntries(
    Object.entries(cms).map(([k, v]) => [
      k,
      {
        tableName: v.tableName,
        columns: v.columns,
        fields: v.fields,
        shape: v.shape,
        stats: v.stats,
      },
    ]),
  ) as CmsJsonMap

  // stats globais
  const totalCollections = collections.length
  const totalFields = collections.reduce((acc, c) => acc + c.fields.length, 0)
  const kindsAll: Record<FieldKind, number> = {
    string: 0,
    number: 0,
    boolean: 0,
    date: 0,
    json: 0,
    enum: 0,
    blob: 0,
    unknown: 0,
  }
  for (const c of collections) {
    const local = buildFieldStats(c.fields).kinds
    for (const k of Object.keys(kindsAll) as FieldKind[]) {
      kindsAll[k] += local[k] ?? 0
    }
  }

  return { cms, cmsJson, collections, globalStats: { totalCollections, totalFields, kinds: kindsAll } }
}

// ---------- Prisma delegates (MVP) ----------
function inferCollectionsFromPrismaClient(client: any): Collection[] {
  const delegates = Object.keys(client).filter((k) => {
    const v = (client as any)[k]
    return v && typeof v === 'object' && typeof v['findMany'] === 'function'
  })
  return delegates.map((slug) => ({ slug, label: slug, fields: [] }))
}

// ---------- sanitize principal ----------
export function sanitize(raw: OpacaConfig): SanitizedConfig {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Config inválido. Deve ser um objeto.')
  }

  const title = raw.admin?.title ?? 'Opaca Admin'
  const s = (raw as any).schema

  // Prisma (MVP)
  if (looksLikePrismaClient(s)) {
    const collections = inferCollectionsFromPrismaClient(s)
    return {
      orm: 'prisma',
      admin: { title, ...raw.admin },
      schema: s,
      collections,
      stats: {
        totalCollections: collections.length,
        totalFields: 0,
        kinds: { string: 0, number: 0, boolean: 0, date: 0, json: 0, enum: 0, blob: 0, unknown: 0 },
      },
    }
  }

  // Drizzle
  const schemaObj = normalizeDrizzleSchemaToObject(s)
  const { cms, cmsJson, collections, globalStats } = buildDrizzleCms(schemaObj)

  return {
    orm: 'drizzle',
    admin: { title, ...raw.admin },
    schema: Array.isArray(s) ? s : schemaObj, // mantenha crú (server-only)
    collections,
    stats: globalStats,
    cms,       // server-only (tem Zod e refs)
    cmsJson,   // JSON-safe
  }
}
