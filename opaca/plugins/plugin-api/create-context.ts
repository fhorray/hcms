import type {
  AppConfig,
  AppEnviroment,
  Logger,
  Registries,
  ServiceRegistry,
  PluginContext, // for getEnv typing only
} from "@opaca/plugins/plugin-api/types";

type StoreShape = {
  db: Array<{ dialect: string; factory: () => unknown }>;
  fields: Array<{ name: string; schema: unknown; renderAdmin?: unknown; sanitize?: (v: unknown) => unknown }>;
  routes: Array<{ method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"; path: string; handler: (c: unknown, next?: unknown) => unknown | Promise<unknown> }>;
  actions: Array<{ name: string; run: (args: unknown) => Promise<unknown> }>;
  pipelines: Array<{ name: string; stage: string; transform: (data: unknown) => Promise<unknown> }>;
};

type CreateCtxOptions = {
  version: string; // app/lib version (not plugin API)
  env: AppEnviroment["NODE_ENV"];
  store: Partial<StoreShape> & Pick<StoreShape, "db" | "fields" | "routes" | "actions"> & { pipelines?: StoreShape["pipelines"] };
  logger?: Partial<Logger>;
  features?: Record<string, unknown>;
  userConfig?: Record<string, unknown>;
  exposeTo?: (exposed: {
    fields: {
      get: (name: string) => StoreShape["fields"][number] | undefined;
      list: () => StoreShape["fields"];
      has: (name: string) => boolean;
    };
  }) => void;
};

/**
 * Build an AppConfig + Registries object backed by the provided store.
 * Idempotent: duplicate registrations are ignored.
 *
 * Note: `registries.services` here is a guard that throws on use. In plugin hooks,
 * use `ctx.services.*` provided by the orchestrator (buildRuntime) as the source of truth.
 */
export function createPluginContext(opts: CreateCtxOptions): {
  app: AppConfig;
  registries: Registries;
  getEnv: PluginContext["getEnv"];
} {
  // ----- Logger (prefixed) -----
  const log: Logger = {
    debug: (...a) => (opts.logger?.debug ?? console.debug)("[opaca]", ...a),
    info: (...a) => (opts.logger?.info ?? console.info)("[opaca]", ...a),
    warn: (...a) => (opts.logger?.warn ?? console.warn)("[opaca]", ...a),
    error: (...a) => (opts.logger?.error ?? console.error)("[opaca]", ...a),
  };

  // ----- App config snapshot -----
  const app: AppConfig = {
    version: opts.version,
    env: { NODE_ENV: opts.env },
    logger: log,
    features: opts.features ?? {},
    userConfig: opts.userConfig ?? {},
  };

  // ----- Ensure store arrays exist -----
  const store: StoreShape = {
    db: opts.store.db ?? [],
    fields: opts.store.fields ?? [],
    routes: opts.store.routes ?? [],
    actions: opts.store.actions ?? [],
    pipelines: opts.store.pipelines ?? [],
  };

  // ----- Idempotency guards -----
  const seenDb = new Set<string>();          // by dialect
  const seenField = new Set<string>();       // by name
  const seenRoute = new Set<string>();       // by "METHOD path"
  const seenAction = new Set<string>();      // by name
  const seenPipeline = new Set<string>();    // by name@stage

  // ----- Registries implementations (write-through to store) -----

  // Database adapters
  const db: Registries["db"] = {
    registerAdapter(dialect: string, factory: () => unknown) {
      const key = String(dialect || "");
      if (!key) throw new Error("DbRegistry.registerAdapter: 'dialect' is required.");
      if (seenDb.has(key)) return;
      seenDb.add(key);
      store.db.push({ dialect: key, factory });
    },
    getAdapter(dialect: string) {
      return store.db.find(d => d.dialect === dialect)?.factory();
    },
  };

  // Field types
  const fields: Registries["fields"] = {
    register(def) {
      if (!def?.name) throw new Error("FieldRegistry.register: 'name' is required.");
      if (seenField.has(def.name)) return;
      seenField.add(def.name);
      store.fields.push(def);
    },
    list() { return store.fields; },
  };

  // Routes: collect descriptors; Hono mounting happens elsewhere (mountPluginsRest)
  const routes: Registries["routes"] = {
    get(path, handler) { registerRoute("GET", path, handler); },
    post(path, handler) { registerRoute("POST", path, handler); },
    put(path, handler) { registerRoute("PUT", path, handler); },
    delete(path, handler) { registerRoute("DELETE", path, handler); },
  };

  function registerRoute(
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
    path: string,
    handler: (c: unknown, next?: unknown) => unknown | Promise<unknown>
  ) {
    if (!path || typeof handler !== "function") {
      throw new Error("RouteRegistry.register: 'path' and 'handler' are required.");
    }
    const key = `${method} ${path}`;
    if (seenRoute.has(key)) return;
    seenRoute.add(key);
    store.routes.push({ method, path, handler });
  }

  // Actions
  const actions: Registries["actions"] = {
    register(def) {
      if (!def?.name || typeof def.run !== "function") {
        throw new Error("ActionRegistry.register: 'name' and async 'run' are required.");
      }
      if (seenAction.has(def.name)) return;
      seenAction.add(def.name);
      store.actions.push(def);
    },
  };

  // Pipelines / transformers
  const pipelines: Registries["pipelines"] = {
    register(def) {
      if (!def?.name || !def.stage || typeof def.transform !== "function") {
        throw new Error("PipelineRegistry.register: 'name', 'stage' and async 'transform' are required.");
      }
      const key = `${def.name}@${def.stage}`;
      if (seenPipeline.has(key)) return;
      seenPipeline.add(key);
      (store.pipelines ??= []).push(def);
    },
    list() { return store.pipelines; },
  };

  // Services (guard). Real cross-plugin services come from orchestrator (ctx.services).
  const guardServices: ServiceRegistry = {
    provide() { throw new Error("registries.services.provide is not available here. Use ctx.services.provide in plugin hooks."); },
    get() { throw new Error("registries.services.get is not available here. Use ctx.services.get in plugin hooks."); },
    require() { throw new Error("registries.services.require is not available here. Use ctx.services.require in plugin hooks."); },
    has() { throw new Error("registries.services.has is not available here. Use ctx.services.has in plugin hooks."); },
  };

  const registries: Registries = {
    db,
    fields,
    routes,
    actions,
    pipelines,
    services: guardServices,
  };

  // ----- Optional read-only views for consumer runtime -----
  opts.exposeTo?.({
    fields: {
      get: (name: string) => store.fields.find(f => f.name === name),
      list: () => store.fields,
      has: (name: string) => !!store.fields.find(f => f.name === name),
    },
  });

  // ----- Env accessor -----
  const getEnv: PluginContext["getEnv"] = <T = unknown>(key: string) => {
    // In Node/Edge you might want to customize how secrets/bindings are resolved.
    return (process.env as any)?.[key] as T | undefined;
  };

  return { app, registries, getEnv };
}