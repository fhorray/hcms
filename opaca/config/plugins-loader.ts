import { satisfies } from "semver";
import { PluginContext, PluginManifest } from "@opaca/plugins/plugin-api/types";

// Internal helper: resolve hard dependencies declared by plugins (if any)
function getRequires(p: PluginManifest): string[] {
  // Keep backward-compatible: if your manifest doesn't declare requires, treat as empty
  return (p as any).requires ?? [];
}

function topoSort(plugins: PluginManifest[]): PluginManifest[] {
  // Standard DFS topological sort by manifest meta.name and optional requires
  const byName = new Map<string, PluginManifest>(
    plugins.map((p) => [p.meta?.name as string, p])
  );

  const perm = new Set<string>();
  const temp = new Set<string>();
  const ordered: PluginManifest[] = [];

  function visit(name: string) {
    if (perm.has(name)) return;
    if (temp.has(name)) throw new Error(`Circular dependency involving plugin \"${name}\"`);
    temp.add(name);

    const p = byName.get(name);
    if (!p) throw new Error(`Missing plugin \"${name}\"`);

    for (const dep of getRequires(p)) {
      if (!byName.has(dep)) throw new Error(`Plugin \"${name}\" requires \"${dep}\" which is not loaded.`);
      visit(dep);
    }

    temp.delete(name);
    perm.add(name);
    ordered.push(p);
  }

  for (const p of plugins) {
    const name = p.meta?.name;
    if (!name) continue;
    visit(name);
  }

  return ordered;
}

type LoadPluginOpts = {
  pluginSpecs: PluginManifest[];
  ctxFactory: PluginContext; // single shared context instance
};

export async function loadPlugins({ pluginSpecs, ctxFactory }: LoadPluginOpts): Promise<PluginManifest[]> {
  const valid: PluginManifest[] = [];

  // 1) Basic validation + version gate (engines.opaca if provided)
  for (const plugin of pluginSpecs) {
    const name = plugin?.meta?.name;
    if (!name) {
      ctxFactory.app.logger.error("[opaca] Plugin missing required meta.name, skipping.");
      continue;
    }

    const range = (plugin.meta as any)?.engines?.opaca as string | undefined;
    if (range && !satisfies(ctxFactory.app.version, range)) {
      ctxFactory.app.logger.error(
        `[opaca] Plugin \"${name}\" requires opaca ${range}, but runtime is ${ctxFactory.app.version}. Skipping.`
      );
      continue;
    }

    valid.push(plugin);
  }

  // 2) Dependency-aware ordering (no-ops if plugins have no `requires`)
  let ordered: PluginManifest[];
  try {
    ordered = topoSort(valid);
  } catch (e) {
    ctxFactory.app.logger.error(`[opaca] Plugin dependency resolution failed:`, e);
    // Fallback to declared order to avoid hard crash in dev
    ordered = valid;
  }

  const loaded: PluginManifest[] = [];

  // 3) Lifecycle: onValidate (fast), onSetup (registrations), then later onStart (side-effects)
  for (const plugin of ordered) {
    const name = plugin.meta.name;
    try {
      // Optional pre-flight
      if (typeof (plugin as any).onValidate === "function") {
        (plugin as any).onValidate(ctxFactory);
      }
    } catch (err) {
      ctxFactory.app.logger.error(`[opaca] onValidate failed for plugin: ${name}`, err);
      continue; // skip faulty plugin
    }
  }

  for (const plugin of ordered) {
    const name = plugin.meta.name;
    try {
      // Prefer onSetup; keep backward-compat with legacy `setup`
      if (typeof (plugin as any).onSetup === "function") {
        await (plugin as any).onSetup(ctxFactory);
      } else if (typeof (plugin as any).setup === "function") {
        (plugin as any).setup(ctxFactory);
      }
      loaded.push(plugin);
      ctxFactory.app.logger.info(`[opaca] Loaded plugin: ${name} (${plugin.meta.version})`);
    } catch (err) {
      ctxFactory.app.logger.error(`[opaca] Failed to setup plugin: ${name}`, err);
    }
  }

  // 4) Start phase (workers, schedulers, caches)
  for (const plugin of loaded) {
    const name = plugin.meta.name;
    try {
      if (typeof (plugin as any).onStart === "function") {
        await (plugin as any).onStart(ctxFactory);
      }
    } catch (err) {
      ctxFactory.app.logger.error(`[opaca] onStart failed for plugin: ${name}`, err);
    }
  }

  return loaded;
}