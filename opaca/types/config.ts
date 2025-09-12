import type * as TSchema from "@/schema";
import { BetterAuthOptions } from 'better-auth';
import * as Lucide from 'lucide-react';
import { LucideIcon } from "lucide-react";
import { OpacaDbAdapter } from "../db/adapter";


// List of lucide icon component names
export type LucideIconName = {
  [K in keyof typeof Lucide]: (typeof Lucide)[K] extends LucideIcon ? K : never
}[keyof typeof Lucide];

// Base primitive types
export type OpacaPrimitiveFieldType =
  | 'array'
  | 'blocks'
  | 'checkbox'
  | 'switcher'
  | 'json'
  | 'code'
  | 'collapsible'
  | 'date'
  | 'email'
  | 'group'
  | 'number'
  | 'point'
  | 'radio-group'
  | 'rich-text'
  | 'join'
  | 'tabs'
  | 'text'
  | 'textarea'
  | 'ui'
  | 'upload';

// Relationship type
export type OpacaRelatioshipFieldType = {
  relationship: { to: keyof typeof TSchema; many?: boolean; through?: string };
};

// Row type (container, sem `name` obrigatório)
export type OpacaRowFieldType = {
  row: OpacaField[];
};

// Select type
export type OpacaSelectFieldType = {
  select: {
    options: { label: string; value: string | number }[];
    multiple?: boolean;
    relationship?: { to: keyof typeof TSchema; valueField: string };
  };
};

export type FieldTypeInput =
  | OpacaPrimitiveFieldType
  | OpacaRelatioshipFieldType
  | OpacaRowFieldType
  | OpacaSelectFieldType;


// ---------- Field definition ----------

// Normal fields that need "name"
export type OpacaBaseField = {
  name: string;
  type: Exclude<FieldTypeInput, OpacaRowFieldType>; // cannot be "row"
  required?: boolean;
  default?: unknown;
  unique?: boolean;
  indexed?: boolean;
  columnName?: string;
  references?: { table: string; field: string };
  hidden?: boolean;
  layout?: { col?: number };
};

// Fields inside "row" (no "name")
export type OpacaRowField = {
  type: OpacaRowFieldType;
  required?: boolean;
  hidden?: boolean;
  layout?: { col?: number };
};

// União final
export type OpacaField = OpacaBaseField | OpacaRowField;

export type OpacaCollection = {
  name: string;               // "Posts"
  slug?: string; // default: slugify(plural(name)) -> "posts"
  icon?: LucideIconName; // default: "Collection" icon
  fields: OpacaField[];
  required?: boolean;
  hidden?: boolean;
};

export type OpacaConfig = {
  collections: OpacaCollection[];
  database?: {
    dialect: string;
    adapter: OpacaDbAdapter;
  }
  admin?: {
    appName?: string;
    appDescription?: string;
    appLang?: string;
    avatar?: 'default' | 'gravatar' | 'dicebar';
    components?: any[],
    dateFormat?: string;

    routes?: {
      account?: `/${string}`;
      browseByFolder?: `/${string}`;
      createFirstUser?: `/${string}`;
      forgot?: `/${string}`;
      inactivity?: `/${string}`;
      login?: `/${string}`;
      logout?: `/${string}`;
      reset?: `/${string}`;
      unauthorized?: `/${string}`; // unauthorized route
    };
    suppressHydrationWarning?: boolean;
    theme?: 'all' | 'dark' | 'light';
    toaster?: {
      duration?: number;
      expand?: boolean;
      limit?: number;
    };
    user?: string;
  },
  auth?: Omit<BetterAuthOptions, "plugins" | "baseURL"> & {
    plugins?: {
      admin?: {

      },
      apiKey?: {
        enabled?: boolean; // default false
        name: string,
        expiresIn: number,
        prefix: string,
        metadata: any | null,
        permissions: Record<string, string[]>
      }

    }
  };
};


// --------------------------------------
// Built types (added/enriched at build):
// --------------------------------------

// Flattened field meta (only concrete fields; rows are expanded)
export type BuiltField = Omit<OpacaBaseField, 'type' | 'columnName'> & {
  type: Exclude<FieldTypeInput, OpacaRowFieldType>;  // guaranteed non-row
  path: `${string}.${string}`;                  // "<collectionSlug>.<fieldName>"
  columnName: string;                           // guaranteed column name
  isRelation?: boolean;
  relation?:
  | OpacaRelatioshipFieldType['relationship']
  | OpacaSelectFieldType['select']['relationship'];
  selectOptions?: { label: string; value: string | number }[] | null;
};

// Relationship registry item
export type BuiltRelation = {
  from: { collection: string; field: string; path: `${string}.${string}` };
  to: { collection: keyof typeof TSchema; via?: string; many?: boolean };
  kind: 'relationship' | 'select.relationship';
};


/*
  Final built config that will be returned, with fast lookups and indexes
*/
export type OpacaBuiltConfig = Omit<OpacaConfig, "collections"> & {
  // Collections normalized by slug key, with resolved slug/icon
  collections: Record<string, OpacaCollection & { slug: string; icon: string }>;

  // Fast indexes and maps
  _index: {
    bySlug: Record<string, number>;                 // position in _index.order
    byName: Record<string, string>;                 // "Users" -> "users" (slug)
    order: string[];                                // ordered slugs
  };

  // Flattened fields and quick-lookups
  _fields: {
    byCollection: Record<string, BuiltField[]>;     // slug -> fields[]
    byPath: Record<`${string}.${string}`, BuiltField>;
  };

  // Relationships discovered (relationship + select.relationship)
  _relationships: {
    list: BuiltRelation[];
    byTarget: Record<string, BuiltRelation[]>;      // target table -> relations[]
  };

  // Select enum options and relationship-backed selects
  _selects: {
    optionsByPath: Record<`${string}.${string}`, { label: string; value: string | number }[]>;
    relationshipByPath: Record<
      `${string}.${string}`,
      OpacaSelectFieldType['select']['relationship'] | undefined
    >;
  };
};