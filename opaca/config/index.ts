// src/opaca/config/define-opaca-config.ts
// Comments in English only.

import { OpacaBuiltConfig, OpacaConfig } from "@opaca/types/config";
import { sanitize } from "./sanitize";

// Your createPluginContext implementation (path as you defined)
import { createPluginContext } from "../plugins/plugin-api/create-context";
import { buildRuntime } from "../plugins/plugin-api/orchestrator";

// Orchestrator that manages lifecycle/deps/services/diagnostics

const APP_VERSION = "0.4.0"; // TODO: read from package.json if desired

// Small readonly runtime view for fields to be used by the client/runtime
function createRuntimeFields(fields: {
  get: (n: string) => { name: string } | undefined;
  list: () => { name: string }[];
  has: (n: string) => boolean;
}) {
  return {
    get: fields.get,
    list: fields.list,
    has: fields.has,
  };
}

/**
 * Build the final Opaca config:
 * - sanitize user config
 * - wire registries to the store via createPluginContext
 * - orchestrate plugins via buildRuntime (ordering + lifecycle)
 * - expose runtime.fields (readonly) for client usage
 *
 * Note: this function is async because plugins may run async setup/start.
 */
export async function defineOpacaConfig(cfg: OpacaConfig): Promise<OpacaBuiltConfig> {
  // 1) Sanitize/normalize collections, fields, indexes, etc.
  const sanitized = sanitize(cfg);

  // 2) Ensure internal registries store exists
  const store = sanitized._registries ?? {
    db: [],
    fields: [],
    routes: [],
    actions: [],
    ui: [],
    pipeline: [],
  };
  sanitized._registries = store;

  // 3) Prepare readonly runtime view for fields
  const runtimeView: { fields?: ReturnType<typeof createRuntimeFields> } = {};

  // 4) Create the plugin context (registries writing into the store)
  const ctx = createPluginContext({
    version: APP_VERSION,
    env: (process.env.NODE_ENV as "development" | "production" | "test") ?? "development",
    store,
    // publish a readonly view of fields for client/runtime usage
    exposeTo: (exposed) => {
      runtimeView.fields = createRuntimeFields(exposed.fields);
    },
  });

  // 5) Orchestrate plugins (ordering, lifecycle, services, diagnostics)
  //    This will call onValidate → onSetup → onStart for each plugin.
  await buildRuntime({
    app: {
      version: APP_VERSION,
      env: { NODE_ENV: (process.env.NODE_ENV as any) ?? "development" },
      logger: console,
      features: {},
      userConfig: {},
    },
    plugins: sanitized.plugins ?? [],
    registries: ctx.registries,
    getEnv: ctx.getEnv,
    // capabilityPolicy?: (plugin, cap) => true, // optional ACL per capability
  });

  // 6) Return built config with runtime.fields (readonly)
  const built: OpacaBuiltConfig = {
    ...sanitized,
    runtime: {
      fields: runtimeView.fields,
    },
  };

  return built;
}