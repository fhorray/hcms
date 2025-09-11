import * as Lucide from 'lucide-react';
import { LucideIcon } from "lucide-react";
import * as schema from "../server/db/schema";
import { betterAuth, BetterAuthOptions } from 'better-auth';

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


// All export names that are React icon components
export type LucideIconName = {
  [K in keyof typeof Lucide]: (typeof Lucide)[K] extends LucideIcon ? K : never
}[keyof typeof Lucide];

export type OpacaCollection = {
  name: string;               // "Posts"
  slug: string; // default: slugify(plural(name)) -> "posts"
  icon?: LucideIconName; // default: "Collection" icon
  fields: Record<string, OpacaField | FieldTypeInput>; // aceita shorthand: "text"
  primaryKey?: string;        // default: "id" autoincrement (serial)
  required?: boolean
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
  },
  auth: Pick<BetterAuthOptions, "hooks" | "databaseHooks" | "advanced" | "emailAndPassword" | "baseURL" | "trustedOrigins" | "plugins" | "user" | "emailVerification" | "basePath" | "account" | "session" | "verification" | "socialProviders">;
};


export type BuiltOpacaConfig = Omit<OpacaConfig, "collections"> & {
  collections: Record<string, OpacaCollection & { slug: string, icon: string }>;
  _index: {
    bySlug: Record<string, number>;
    order: string[];
  };
};