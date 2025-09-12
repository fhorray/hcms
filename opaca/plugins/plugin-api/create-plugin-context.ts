// Comments in English only.

import type {
  OpacaActionDescriptor,
  OpacaDbAdapterDescriptor,
  OpacaFieldDescriptor,
  OpacaPluginContext,
  OpacaRouteDescriptor,
  OpacaTransformerDescriptor,
  OpacaUIPanelDescriptor,
  OpacaInternalRegistriesStore,
} from "../plugin-api/types";

/**
 * Thin registry wrapper that writes into the sanitized._registries arrays
 * (for compatibility with your current build pipeline) AND keeps fast lookup
 * Maps for runtime (admin rendering, pipelines, etc).
 */
export function createPluginContext(params: {
  version: string;
  env: "production" | "development";
  log?: Console;
  /** Reference to the sanitized object’s _registries arrays */
  store: OpacaInternalRegistriesStore;
  /** Optional: attach read APIs for runtime consumers */
  exposeTo?: (exposed: {
    db: ReadonlyRegistry<OpacaDbAdapterDescriptor>;
    fields: ReadonlyRegistry<OpacaFieldDescriptor>;
    routes: ReadonlyArray<OpacaRouteDescriptor>;
    actions: ReadonlyRegistry<OpacaActionDescriptor>;
    ui: ReadonlyArray<OpacaUIPanelDescriptor>;
    pipeline: ReadonlyArray<OpacaTransformerDescriptor>;
  }) => void;
}) {
  const log = params.log ?? console;

  // --- DB registry
  const dbMap = new Map<string, OpacaDbAdapterDescriptor>();
  const dbRegistry = {
    register(a: OpacaDbAdapterDescriptor) {
      if (!a?.name) throw new Error("DbAdapterDescriptor.name is required.");
      if (dbMap.has(a.name)) throw new Error(`DB adapter "${a.name}" already registered.`);
      dbMap.set(a.name, a);
      params.store.db.push(a);
    },
    get(name: string) {
      return dbMap.get(name);
    },
    list() {
      return [...dbMap.values()];
    },
    has(name: string) {
      return dbMap.has(name);
    },
  };

  // --- Fields registry
  const fieldMap = new Map<string, OpacaFieldDescriptor>();
  const fieldsRegistry = {
    register(a: OpacaFieldDescriptor) {
      if (!a?.name) throw new Error("FieldDescriptor.name is required.");
      if (fieldMap.has(a.name)) throw new Error(`Field "${a.name}" already registered.`);
      fieldMap.set(a.name, a);
      params.store.fields.push(a);
    },
    get(name: string) {
      return fieldMap.get(name);
    },
    list() {
      return [...fieldMap.values()];
    },
    has(name: string) {
      return fieldMap.has(name);
    },
  };

  // --- Routes registry (no keyed map necessary)
  const routesRegistry = {
    register(a: OpacaRouteDescriptor) {
      params.store.routes.push(a);
    },
    list() {
      return [...params.store.routes];
    },
  };

  // --- Actions registry
  const actionMap = new Map<string, OpacaActionDescriptor>();
  const actionsRegistry = {
    register(a: OpacaActionDescriptor) {
      if (!a?.name) throw new Error("ActionDescriptor.name is required.");
      if (actionMap.has(a.name)) throw new Error(`Action "${a.name}" already registered.`);
      actionMap.set(a.name, a);
      params.store.actions.push(a);
    },
    get(name: string) {
      return actionMap.get(name);
    },
    list() {
      return [...actionMap.values()];
    },
    has(name: string) {
      return actionMap.has(name);
    },
  };

  // --- UI registry
  const uiRegistry = {
    registerPanel(a: OpacaUIPanelDescriptor) {
      params.store.ui.push(a);
    },
    list() {
      return [...params.store.ui];
    },
  };

  // --- Pipeline registry
  const pipelineRegistry = {
    register(a: OpacaTransformerDescriptor) {
      params.store.pipeline.push(a);
    },
    list() {
      return [...params.store.pipeline];
    },
  };

  const ctx: OpacaPluginContext = {
    version: params.version,
    env: params.env,
    log: {
      info: (...a) => log.info("[opaca]", ...a),
      warn: (...a) => log.warn("[opaca]", ...a),
      error: (...a) => log.error("[opaca]", ...a),
    },
    registries: {
      db: dbRegistry,
      fields: fieldsRegistry,
      routes: routesRegistry,
      actions: actionsRegistry,
      ui: uiRegistry,
      pipeline: pipelineRegistry,
    },
    resources: {},
  };

  // Optionally expose read-only handles to your runtime (admin/server)
  if (params.exposeTo) {
    params.exposeTo({
      db: toReadonly(dbRegistry),
      fields: toReadonly(fieldsRegistry),
      routes: routesRegistry.list(),
      actions: toReadonly(actionsRegistry),
      ui: uiRegistry.list(),
      pipeline: pipelineRegistry.list(),
    });
  }

  return ctx;
}

/** Helper types for read-only exposure */
type ReadonlyRegistry<T extends { name: string }> = {
  get: (name: string) => T | undefined;
  list: () => T[];
  has: (name: string) => boolean;
};
function toReadonly<T extends { name: string }>(r: {
  get: (n: string) => T | undefined;
  list: () => T[];
  has: (n: string) => boolean;
}): ReadonlyRegistry<T> {
  return {
    get: r.get,
    list: r.list,
    has: r.has,
  };
}
