import { satisfies } from "semver"; // keep it small; or write your own check
import { OpacaPluginContext, OpacaPluginManifest } from "@opaca/plugins/plugin-api/types";

type LoadPluginOpts = {
  pluginSpecs: OpacaPluginManifest[]; // e.g. ["@acme/opaca-plugin-d1", "./plugins/local-foo"]
  ctxFactory: OpacaPluginContext;
};

export function loadPlugins({
  pluginSpecs,
  ctxFactory,
}: LoadPluginOpts): OpacaPluginManifest[] {

  const loaded: OpacaPluginManifest[] = [];

  for (const plugin of pluginSpecs) {
    if (!plugin?.meta?.name) {
      ctxFactory.log.warn(`[opaca] Invalid plugin — skipping.`);
      continue;
    }

    try {
      plugin.setup(ctxFactory);
      loaded.push(plugin);
      ctxFactory.log.info(`[opaca] Loaded plugin: ${plugin.meta.name} (${plugin.meta.version})`);
    } catch (err) {
      ctxFactory.log.error(`[opaca] Failed to setup plugin: ${plugin.meta.name}`, err);
    }
  }

  return loaded;
}