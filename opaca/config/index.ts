import { OpacaBuiltConfig, OpacaConfig } from "@opaca/types/config";
import { OpacaActionDescriptor, OpacaDbAdapterDescriptor, OpacaFieldDescriptor, OpacaInternalRegistriesStore, OpacaRouteDescriptor, OpacaTransformerDescriptor, OpacaUIPanelDescriptor } from "../plugin-api/types";
import { loadPlugins } from "./plugins-loader";
import { sanitize } from "./sanitize";
import { createPluginContext } from "../plugin-api/create-plugin-context";


export function defineOpacaConfig(cfg: OpacaConfig): OpacaBuiltConfig {
  const sanitized = sanitize(cfg);

  // Ensure internal arrays exist and are typed
  const store: OpacaInternalRegistriesStore = sanitized._registries ?? {
    db: [],
    fields: [],
    routes: [],
    actions: [],
    ui: [],
    pipeline: [],
  };
  sanitized._registries = store;


  let runtime: {
    fields?: ReturnType<typeof createRuntimeFields>
    // add others later if needed
  } = {};

  // build a single context instance used by plugins
  const ctx = createPluginContext({
    version: "0.4.0", // TODO: get from package.json
    env: process.env.NODE_ENV === "production" ? "production" : "development",
    store,
    exposeTo: (exposed) => {
      runtime.fields = createRuntimeFields(exposed.fields);
    }
  });

  // Provide a factory that returns the SAME ctx (witout duplicating)


  const plugins = loadPlugins({
    pluginSpecs: sanitized.plugins ?? [],
    ctxFactory: ctx
  })


  return {
    ...sanitized,
    plugins,
    // Optional: expose runtime registries to your app
    runtime: {
      fields: runtime.fields,
    },
  };
}


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