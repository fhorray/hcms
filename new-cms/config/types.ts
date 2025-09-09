// new-cms/config/types.ts
import type { z } from 'zod'

export type SchemaType = Record<string, any> | object[] | object // Drizzle/Prisma

export type FieldKind =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'json'
  | 'enum'
  | 'blob'
  | 'unknown'

export type FieldShapeMeta = {
  kind: FieldKind
  optional: boolean
  nullable: boolean
  hasDefault: boolean
  enumValues?: readonly string[]
}

export type ColumnMeta = {
  name: string
  kind: FieldKind
  isNullable: boolean
  isPrimaryKey: boolean
  hasDefault: boolean
  enumValues?: readonly string[]
  order: number
}

export type Collection = {
  slug: string
  label: string
  fields: ColumnMeta[] // versão JSON-safe dos fields
  tableName?: string   // para Drizzle
}

export type TableCmsSchemaTyped = {
  tableName: string
  insert: z.ZodTypeAny   // Zod (não serializável)
  select: z.ZodTypeAny
  update: z.ZodTypeAny
  columns: Record<string, ColumnMeta>
  fields: ColumnMeta[]
  shape: {
    insert: Record<string, FieldShapeMeta>
    select: Record<string, FieldShapeMeta>
    update: Record<string, FieldShapeMeta>
  }
  stats: {
    fieldCount: number
    requiredCount: number
    optionalCount: number
    kinds: Record<FieldKind, number>
  }
}

export type CmsMap = Record<string, TableCmsSchemaTyped>

// Versão serializável (sem Zod e sem objetos Drizzle)
export type CmsJsonMap = {
  [K in keyof CmsMap]: {
    tableName: CmsMap[K]['tableName']
    columns: CmsMap[K]['columns']
    fields: CmsMap[K]['fields']
    shape: CmsMap[K]['shape']
    stats: CmsMap[K]['stats']
  }
}

export type AdminConfig = {
  lang?: 'en' | 'pt-BR'
  path?: string
  title?: string
  logoUrl?: string
  faviconUrl?: string
  theme?: 'light' | 'dark' | 'system'
  defaultRole?: string
  roles?: string[]
}

export type PluginFn = (c: OpacaConfig) => Promise<OpacaConfig> | OpacaConfig

export type OpacaConfig = {
  admin?: AdminConfig
  schemaPath?: string
  schema: SchemaType
  secret?: string
  email?: any
  plugins?: PluginFn[]
  editor?: any
  cookiePrefix?: string
}

export type SanitizedConfig = {
  orm: 'drizzle' | 'prisma'
  admin: Required<Pick<AdminConfig, 'title'>> & AdminConfig
  schema: SchemaType                // crú (não serializável)
  collections: Collection[]     // lista serializável por coleção
  stats: {
    totalCollections: number
    totalFields: number
    kinds: Record<FieldKind, number>
  }
  // Só para DRIZZLE:
  cms?: CmsMap         // Server-only (contém Zod e refs internas)
  cmsJson?: CmsJsonMap // JSON-safe
}
