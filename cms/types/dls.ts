import * as Lucide from 'lucide-react';
import { LucideIcon } from "lucide-react";
import * as schema from "../server/db/schema";
import { betterAuth, BetterAuthOptions } from 'better-auth';

// ---------- FieldTypeInput refinado ----------

// All export names that are React icon components
export type LucideIconName = {
  [K in keyof typeof Lucide]: (typeof Lucide)[K] extends LucideIcon ? K : never
}[keyof typeof Lucide];

// Base primitive types
export type PrimitiveFieldType =
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
export type RelationshipFieldType = {
  relationship: { to: keyof typeof schema; many?: boolean; through?: string };
};

// Row type (container, sem `name` obrigatório)
export type RowFieldType = {
  row: OpacaField[];
};

// Select type
export type SelectFieldType = {
  select: {
    options: { label: string; value: string | number }[];
    multiple?: boolean;
    relationship?: { to: keyof typeof schema; valueField: string };
  };
};

export type FieldTypeInput =
  | PrimitiveFieldType
  | RelationshipFieldType
  | RowFieldType
  | SelectFieldType;


// ---------- Field definition ----------

// Campos "normais" (precisam de name)
export type BaseOpacaField = {
  name: string;
  type: Exclude<FieldTypeInput, RowFieldType>; // não pode ser row
  required?: boolean;
  default?: unknown;
  unique?: boolean;
  indexed?: boolean;
  columnName?: string;
  references?: { table: string; field: string };
  hidden?: boolean;
  layout?: { col?: number };
};

// Campo do tipo "row" (não precisa de name)
export type RowOpacaField = {
  type: RowFieldType;
  required?: boolean;
  hidden?: boolean;
  layout?: { col?: number };
};

// União final
export type OpacaField = BaseOpacaField | RowOpacaField;

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
  auth: Omit<BetterAuthOptions, "plugins" | "baseURL"> & {
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


export type BuiltOpacaConfig = Omit<OpacaConfig, "collections"> & {
  collections: Record<string, OpacaCollection & { slug: string, icon: string }>;
  _index: {
    bySlug: Record<string, number>;
    order: string[];
  };
};