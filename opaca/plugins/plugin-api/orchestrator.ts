import semver from "semver";
import {
  PLUGIN_API_VERSION,
  type PluginManifest,
  type AppConfig,
  type PluginContext,
  type Registries
} from "@opaca/plugins/plugin-api/types";

export interface BuildOptions {
  app: AppConfig;
  plugins: PluginManifest[];
  registries: Registries;
  getEnv?: PluginContext["getEnv"];
  // Optional feature: capability ACL (allow/deny by plugin)
  capabilityPolicy?: (plugin: PluginManifest, cap: string) => boolean;
}

type Disposer = () => void | Promise<void>;

/**
 * Topological sort of plugins by their "requires" field.
 * @param plugins Array of plugin manifests to sort.
 * @returns Sorted array of plugin manifests.
 */
function topoSort(plugins: PluginManifest[]): PluginManifest[] {
  const graph = new Map(plugins.map(p => [p.meta.name, p]));
  const perm = new Set<string>();
  const temp = new Set<string>();
  const out: PluginManifest[] = [];

  function visit(n: string) {
    if (perm.has(n)) return;
    if (temp.has(n)) throw new Error(`Circular dependency involving "${n}"`);
    temp.add(n);
    const p = graph.get(n);
    if (!p) throw new Error(`Missing plugin "${n}"`);
    (p.requires ?? []).forEach(visit);
    temp.delete(n);
    perm.add(n);
    out.push(p);
  }

  plugins.forEach(p => visit(p.meta.name));
  return out;
}

export async function buildRuntime(opts: BuildOptions) {
  const { app, plugins, registries, getEnv, capabilityPolicy } = opts;

  // 1) Validate engine compatibility & conflicts
  for (const p of plugins) {
    const apiRange = p.meta.engines?.pluginApi;
    if (apiRange && !semver.satisfies(PLUGIN_API_VERSION, apiRange)) {
      throw new Error(`Plugin "${p.meta.name}" expects plugin API ${apiRange}, got ${PLUGIN_API_VERSION}`);
    }
    const conflicts = p.conflicts ?? [];
    conflicts.forEach(conf => {
      if (plugins.some(x => x.meta.name === conf)) {
        throw new Error(`Plugin "${p.meta.name}" conflicts with "${conf}"`);
      }
    });
  }

  // 2) Sort by requires
  const ordered = topoSort(plugins);

  // 3) Service registry (shared across all)
  const servicesBag = new Map<string, unknown>();
  const serviceRegistry = {
    provide<T>(name: string, svc: T) {
      if (servicesBag.has(name)) throw new Error(`Service "${name}" already provided`);
      servicesBag.set(name, svc);
    },
    get<T>(name: string) { return servicesBag.get(name) as T | undefined; },
    require<T>(name: string) {
      const v = servicesBag.get(name);
      if (!v) throw new Error(`Required service "${name}" not found`);
      return v as T;
    },
    has(name: string) { return servicesBag.has(name); },
  };

  // 4) Diagnostics & resource management // TODO: improve this as necessary for the future updates
  const healthChecks = new Map<string, () => Promise<{ ok: boolean; info?: unknown }>>();
  const metrics = new Map<string, () => Promise<number>>();
  const resources = new Map<string, Disposer[]>();

  function makeCtx(p: PluginManifest): PluginContext {
    // Optional: enforce capability ACL at registry boundary
    const guardedRegistries = registries; // keep simple: policy can live inside registries if needed

    return {
      meta: p.meta,
      app,
      registries: guardedRegistries,
      getEnv: (k) => getEnv?.(k),
      services: serviceRegistry,
      diagnostics: {
        addHealthCheck(name, fn) {
          healthChecks.set(`${p.meta.name}:${name}`, fn);
        },
        addMetric(name, fn) {
          metrics.set(`${p.meta.name}:${name}`, fn);
        }
      },
      resources: {
        set(name, disposer) {
          const key = p.meta.name;
          const arr = resources.get(key) ?? [];
          arr.push(disposer);
          resources.set(key, arr);
        }
      }
    };
  }

  // 5) Phases with timing
  const timings: Record<string, { validate?: number; setup?: number; start?: number; stop?: number }> = {};
  const now = () => performance.now();

  for (const p of ordered) {
    const t0 = now();
    p.onValidate?.(makeCtx(p));
    timings[p.meta.name] = { ...timings[p.meta.name], validate: now() - t0 };
  }

  for (const p of ordered) {
    const t0 = now();
    await p.onSetup?.(makeCtx(p));
    timings[p.meta.name] = { ...timings[p.meta.name], setup: now() - t0 };
  }

  for (const p of ordered) {
    const t0 = now();
    await p.onStart?.(makeCtx(p));
    timings[p.meta.name] = { ...timings[p.meta.name], start: now() - t0 };
  }

  async function stop() {
    // stop in reverse order and dispose resources
    for (const p of [...ordered].reverse()) {
      const t0 = now();
      await p.onStop?.(makeCtx(p));
      timings[p.meta.name] = { ...timings[p.meta.name], stop: now() - t0 };

      const arr = resources.get(p.meta.name) ?? [];
      for (const d of arr.reverse()) await d();
    }
  }

  async function checkHealth() {
    const entries: Record<string, { ok: boolean; info?: unknown }> = {};
    for (const [key, fn] of healthChecks) {
      try {
        entries[key] = await fn();
      } catch (e) {
        entries[key] = { ok: false, info: String(e) };
      }
    }
    return entries;
  }

  async function collectMetrics() {
    const out: Record<string, number> = {};
    for (const [key, fn] of metrics) {
      try { out[key] = await fn(); } catch { /* ignore */ }
    }
    return out;
  }

  return {
    services: serviceRegistry,
    registries,
    timings,
    checkHealth,
    collectMetrics,
    stop,
  };
}