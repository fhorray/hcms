import { Context } from "hono";
import { Variables } from "@opaca/types/hono";

export type SemverRange = string;

export interface OpacaPluginMeta {
  name: string;
  version: string;
  engines: { opaca: SemverRange };
  author?: string;
  homepage?: string;
  description?: string;
}

export interface OpacaDbAdapterDescriptor {
  name: string; // "d1" | "sqlite" | "postgres"
  create: (options: unknown) => Promise<unknown>;
}

export interface OpacaPluginManifest {
  meta: OpacaPluginMeta;
  capabilities?: Array<unknown>;
  onInstall?: (ctx: OpacaPluginContext) => void;            // must be sync for this loader
  onLoad?: (ctx: OpacaPluginContext) => void;               // must be sync for this loader
  onBeforeRequest?: (ctx: OpacaPluginContext, req: Request) => void;
  onAfterRequest?: (ctx: OpacaPluginContext, res: Response) => void;
  setup: (ctx: OpacaPluginContext) => void;                 // must be sync for this loader
}

export interface OpacaFieldSchema {
  kind: "string" | "number" | "boolean" | "json" | "date";
  required?: boolean;
  default?: unknown;
  meta?: Record<string, unknown>;
}

export type FieldAdminProps = {
  value: any;
  onChange: (v: any) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  config?: Record<string, unknown>;
};

export interface OpacaFieldDescriptor {
  name: string; // "text", "checkbox", "json", ...
  schema: OpacaFieldSchema;
  renderAdmin: React.ComponentType<FieldAdminProps>;
  serialize?: (value: unknown) => unknown;
  deserialize?: (raw: unknown) => unknown;
  sanitize?: (value: unknown) => unknown;
  validate?: (value: unknown) => void;
}

export interface OpacaRouteDescriptor {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "ALL";
  path: string;
  handler: (c: Context<{
    Variables: Variables
  }> | Request) => Response | Promise<Response>;
}

export interface OpacaActionDescriptor {
  name: string;
  run: (input: any | unknown) => Promise<any | unknown>;
}

export interface OpacaUIPanelDescriptor {
  id: string;
  slot: "sidebar" | "toolbar" | "footer";
  component: React.ComponentType<any>;
}

export interface OpacaTransformerDescriptor {
  id: string;
  stage: "sanitize" | "validate" | "beforeSave" | "afterRead";
  run: (input: any, ctx: { collection: string }) => any | Promise<any>;
}

/** Narrow runtime registries surface used inside plugins */
export interface OpacaPluginRegistries {
  db: {
    register: (a: OpacaDbAdapterDescriptor) => void;
    get: (name: string) => OpacaDbAdapterDescriptor | undefined;
    list: () => OpacaDbAdapterDescriptor[];
    has: (name: string) => boolean;
  };
  fields: {
    register: (a: OpacaFieldDescriptor) => void;
    get: (name: string) => OpacaFieldDescriptor | undefined;
    list: () => OpacaFieldDescriptor[];
    has: (name: string) => boolean;
  };
  routes: {
    register: (a: OpacaRouteDescriptor) => void;
    list: () => OpacaRouteDescriptor[];
  };
  actions: {
    register: (a: OpacaActionDescriptor) => void;
    get: (name: string) => OpacaActionDescriptor | undefined;
    list: () => OpacaActionDescriptor[];
    has: (name: string) => boolean;
  };
  ui: {
    registerPanel: (a: OpacaUIPanelDescriptor) => void;
    list: () => OpacaUIPanelDescriptor[];
  };
  pipeline: {
    register: (a: OpacaTransformerDescriptor) => void;
    list: () => OpacaTransformerDescriptor[];
  };
}

export interface OpacaPluginContext {
  version: string;
  env: "production" | "development";
  log: { info: (...a: any[]) => void; warn: (...a: any[]) => void; error: (...a: any[]) => void };
  registries: OpacaPluginRegistries;
  resources: {
    // Add opt-in resources here, e.g. getDb, caches, etc.
    [k: string]: unknown;
  };
}

/** Utility type for your built config’s private registries store */
export interface OpacaInternalRegistriesStore {
  db: OpacaDbAdapterDescriptor[];
  fields: OpacaFieldDescriptor[];
  routes: OpacaRouteDescriptor[];
  actions: OpacaActionDescriptor[];
  ui: OpacaUIPanelDescriptor[];
  pipeline: OpacaTransformerDescriptor[];
}
