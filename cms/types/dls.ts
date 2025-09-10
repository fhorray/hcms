import { LucideIcon } from "lucide-react";
import * as schema from "../server/db/schema";

// Entrada mais amigável (opções só quando quiser)
export type FieldTypeInput =
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
  | 'row'
  | 'select'
  | 'tabs'
  | 'text'
  | 'textarea'
  | 'ui'
  | 'upload'
  | { enum: string[] }
  | { relationship: { to: keyof typeof schema; many?: boolean; through?: string } };

export type OpacaField = {
  type: FieldTypeInput;
  required?: boolean;
  default?: unknown;
  unique?: boolean;
  indexed?: boolean;
  columnName?: string;
  // se quiser forçar, ainda pode:
  references?: { table: string; field: string };
};

export type OpacaCollection = {
  name: string;               // "Posts"
  slug: string;              // default: slugify(plural(name)) -> "posts"
  icon?: LucideIcon; // optional, for admin UI
  fields: Record<string, OpacaField | FieldTypeInput>; // aceita shorthand: "text"
  primaryKey?: string;        // default: "id" autoincrement (serial)
};

export type OpacaConfig = {
  collections: OpacaCollection[];
  database?: {
    schemas: any;
  }
  admin: {
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
  }
};


export type BuiltOpacaConfig = Omit<OpacaConfig, "collections"> & {
  collections: Record<string, OpacaCollection & { slug: string }>;
  _index: {
    bySlug: Record<string, number>;
    order: string[];
  };
};