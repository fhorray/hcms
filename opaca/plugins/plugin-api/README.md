
# Opaca Plugin API — Developer Guide

> Version: **Plugin API `0.1.0`** · Last updated: _2025-09-13_  
> Scope: **Authoring plugins** only (manifests, capabilities, context & registries, lifecycle).  
> Out of scope: core admin UI internals, collection schema design, or non‑plugin app code.

---

## Table of Contents

1. [Overview](#overview)
2. [Versioning & Compatibility](#versioning--compatibility)
3. [Quick Start: Your First Plugin](#quick-start-your-first-plugin)
4. [Plugin Manifest Reference](#plugin-manifest-reference)
   - [Meta](#meta)
   - [Capabilities](#capabilities)
   - [Dependencies](#dependencies)
   - [Lifecycle Hooks](#lifecycle-hooks)
5. [Plugin Context & Registries](#plugin-context--registries)
   - [App](#app)
   - [Registries](#registries)
   - [Service Registry](#service-registry)
   - [Diagnostics](#diagnostics)
   - [Resources / Teardown](#resources--teardown)
6. [Capability Cookbook (Lots of Examples)](#capability-cookbook-lots-of-examples)
   - [Routes](#routes)
   - [Service](#service)
   - [DB Adapter](#db-adapter)
   - [Field](#field)
   - [Pipeline / Transformer](#pipeline--transformer)
   - [Auth](#auth)
   - [Action](#action)
   - [UI](#ui)
   - [Importer](#importer)
   - [Content Type](#content-type)
   - [Hook & Middleware](#hook--middleware)
   - [Storage Adapter](#storage-adapter)
   - [Search Engine](#search-engine)
   - [Notification](#notification)
   - [Scheduler](#scheduler)
   - [Localization](#localization)
   - [Theme](#theme)
   - [Menu](#menu)
   - [Permission](#permission)
   - [Integration](#integration)
   - [Form](#form)
   - [Dashboard](#dashboard)
   - [Analytics](#analytics)
   - [SEO](#seo)
   - [Cache](#cache)
   - [Logger](#logger)
   - [Error Handler](#error-handler)
   - [Webhook](#webhook)
   - [Other / Custom](#other--custom)
7. [Idempotency, Safety & Best Practices](#idempotency-safety--best-practices)
8. [Testing Plugins](#testing-plugins)
9. [Load Flow: Runtime & Orchestrator](#load-flow-runtime--orchestrator)
10. [FAQ](#faq)

---

## Overview

The **Opaca Plugin API** lets you extend the platform by **declaring capabilities** (e.g., routes, services, fields, pipelines) and **implementing lifecycle hooks**. The core wires your plugin into the app using a **typed `PluginContext`** with **registries** and utilities. Your plugin **declares intent** via a manifest, while the core **drives execution** (order, lifecycle, diagnostics) through the orchestrator.

**Design goals**
- **Stable contract**: small, typed surface area that changes slowly.
- **DX first**: simple manifest, tiny registries, great error messages.
- **Capability-based**: least-privilege by capability instead of “grab everything.”
- **Composability**: services between plugins via a shared `ServiceRegistry`.
- **Safety**: idempotent registries, teardown, health/metrics, conflict detection.

---

## Versioning & Compatibility

- `PLUGIN_API_VERSION = "0.1.0"` — This is the **protocol** version for plugin authors.
- Your plugin can restrict supported versions via `meta.engines.pluginApi` (semver).
- The host app/library may have its own `version` (distinct from the protocol).
- The orchestrator checks `engines.pluginApi` and fails fast if incompatible.

Example:

```ts
export const MyPlugin = createPlugin({
  meta: {
    name: "acme.my-plugin",
    version: "0.3.1",
    engines: { pluginApi: "^0.1.0" } // compatible with 0.1.x
  },
  // ...
});
```

---

## Quick Start: Your First Plugin

Minimal “hello routes” plugin:

```ts
import { createPlugin } from "@opaca/plugins/plugin-api/types";

export const HelloRoutes = (base = "/api/hello") => createPlugin({
  meta: { name: "acme.hello", version: "0.1.0", engines: { pluginApi: "^0.1.0" } },
  capabilities: [{ type: "routes", basePath: base, methods: ["GET"] }],
  onSetup(ctx) {
    ctx.registries.routes.get(`${base}`, () => ({ ok: true, message: "Hello from plugin!" }));
    ctx.registries.routes.get(`${base}/ping`, () => ({ pong: true }));
  }
});
```

Add to your app config:

```ts
plugins: [
  HelloRoutes("/api/hello")
]
```

When the app boots, `onSetup` runs and your routes are mounted under `/api/hello` via the core’s router mounting helper.

---

## Plugin Manifest Reference

### Meta

```ts
interface PluginMeta {
  name: string;             // globally unique, e.g. "acme.auth"
  version: string;          // your plugin version
  engines?: { pluginApi?: string; app?: string };
  author?: string;
  description?: string;
  namespace?: string;       // optional reserved namespace, e.g. "opaca.auth"
}
```

### Capabilities

Capabilities **declare what your plugin is allowed to do** (and what the core should expect). Common types include `"routes"`, `"db-adapter"`, `"service"`, `"field"`, `"pipeline"`, `"auth"`, `"action"`, `"ui"`, etc. See the [Capability Cookbook](#capability-cookbook-lots-of-examples).

### Dependencies

```ts
interface PluginDeps {
  requires?: string[];    // hard deps by plugin name
  optional?: string[];    // soft deps
  conflicts?: string[];   // mutually exclusive
  provides?: string[];    // service names you provide
  consumes?: string[];    // service names you expect
}
```

The orchestrator topologically sorts plugins by `requires`, refuses `conflicts`, and exposes services across plugins.

### Lifecycle Hooks

```ts
interface PluginLifecycle {
  onValidate?(ctx): void;                 // sync, fast checks
  onSetup?(ctx): void | Promise<void>;    // register routes/fields/services
  onStart?(ctx): void | Promise<void>;    // start intervals, caches, workers
  onStop?(ctx): void | Promise<void>;     // teardown (reverse of onStart)
}
```

**Rules**
- Keep `onValidate` synchronous and quick.
- `onSetup` must be **idempotent**.
- Use `resources.set()` in `onStart` to register disposers for `onStop`.

---

## Plugin Context & Registries

Every hook receives a `PluginContext` with access to **app**, **registries**, **services**, **diagnostics**, and **resources**.

### App

```ts
ctx.app.version;        // host app/lib version (semver)
ctx.app.env.NODE_ENV;   // "development" | "production" | "test"
ctx.app.logger.info(...);
ctx.getEnv("DB_URL");   // environment accessor
```

### Registries

- **RouteRegistry**: `get/post/put/delete(path, handler)`  
- **DbRegistry**: `registerAdapter(dialect, factory)` + `getAdapter(dialect)`  
- **FieldRegistry**: `register({ name, schema, renderAdmin?, sanitize? })` + `list()`  
- **ActionRegistry**: `register({ name, run })`  
- **PipelineRegistry**: `register({ name, stage, transform })` + `list()`  
- **ServiceRegistry**: exposed as `ctx.services` (see below)

> Registries are **append-only**, **idempotent**, and write into the internal store used later by the server to mount routes, etc.

### Service Registry

Cross-plugin communication via named services:

```ts
// Provide a service
ctx.services.provide("users", {
  async findById(id: string) { /* ... */ }
});

// Consume a service (throws if missing)
const users = ctx.services.require<{ findById(id: string): Promise<any> }>("users");

// Optional check
if (ctx.services.has("cache")) {
  const cache = ctx.services.get<{ get(k:string): any }>("cache");
}
```

### Diagnostics

Register health checks and metrics (queried by core endpoints):

```ts
ctx.diagnostics.addHealthCheck("users-db", async () => ({ ok: true }));
ctx.diagnostics.addMetric("cache-size", async () => 42);
```

### Resources / Teardown

Track resources to **clean up** during shutdown:

```ts
const id = setInterval(() => ctx.app.logger.debug("tick"), 60_000);
ctx.resources.set("interval", () => clearInterval(id));
```

---

## Capability Cookbook (Lots of Examples)

> Code comments are in English only by design.

### Routes

```ts
import { createPlugin } from "@opaca/plugins/plugin-api/types";

export const PublicApi = (base = "/api/public") => createPlugin({
  meta: { name: "acme.public-api", version: "0.1.0", engines: { pluginApi: "^0.1.0" } },
  capabilities: [{ type: "routes", basePath: base, methods: ["GET","POST"] }],
  onSetup(ctx) {
    ctx.registries.routes.get(`${base}/ping`, () => ({ pong: true }));
    ctx.registries.routes.post(`${base}/echo`, async (c: any) => {
      const body = await c.req.json();
      return { ok: true, echo: body };
    });
  }
});
```

**Per-request services**: handlers can read `c.get("services")` if your app populates it.

```ts
ctx.registries.routes.get(`${base}/posts/:id`, async (c: any) => {
  const id = c.req.param("id");
  const services = c.get("services");
  const posts = services["posts"];
  return await posts.getById(id);
});
```

---

### Service

Provide a cross-plugin service:

```ts
export const UsersService = () => createPlugin({
  meta: { name: "acme.users", version: "0.1.0" },
  provides: ["users"],
  capabilities: [{ type: "service", name: "users", lifecycle: "singleton" }],
  onSetup(ctx) {
    ctx.services.provide("users", {
      async findById(id: string) { /* ... */ return { id, name: "Alice" }; },
      async list(limit = 10) { /* ... */ return []; }
    });
  }
});
```

Consume it from routes:

```ts
export const UsersRoutes = (base = "/api/users") => createPlugin({
  meta: { name: "acme.users.routes", version: "0.1.0" },
  requires: ["acme.users"],
  capabilities: [{ type: "routes", basePath: base }],
  onSetup(ctx) {
    const users = ctx.services.require<{ findById(id: string): Promise<any> }>("users");
    ctx.registries.routes.get(`${base}/:id`, (c: any) => users.findById(c.req.param("id")));
  }
});
```

---

### DB Adapter

```ts
export const D1AdapterPlugin = () => createPlugin({
  meta: { name: "acme.db.d1", version: "0.1.0" },
  capabilities: [{ type: "db-adapter", dialect: "d1", migrations: true }],
  onSetup(ctx) {
    ctx.registries.db.registerAdapter("d1", () => {
      // Return a DB handle or factory; the app decides how to use it
      return { query: async (sql: string) => {/*...*/} };
    });
  }
});
```

Use it elsewhere:

```ts
const db = ctx.registries.db.getAdapter("d1"); // returns your factory/product
```

---

### Field

```ts
export const ColorField = () => createPlugin({
  meta: { name: "acme.field.color", version: "0.1.0" },
  capabilities: [{ type: "field", name: "color" }],
  onSetup(ctx) {
    ctx.registries.fields.register({
      name: "color",
      schema: { kind: "string", pattern: /^#([0-9a-f]{6}|[0-9a-f]{3})$/i },
      sanitize: (v: unknown) => (typeof v === "string" ? v.trim() : "")
      // renderAdmin is app-specific and optional
    });
  }
});
```

---

### Pipeline / Transformer

```ts
export const SlugifyPipeline = () => createPlugin({
  meta: { name: "acme.pipeline.slugify", version: "0.1.0" },
  capabilities: [{ type: "pipeline", stage: "preProcess", priority: 10 }],
  onSetup(ctx) {
    ctx.registries.pipelines.register({
      name: "slugifyTitle",
      stage: "preProcess",
      async transform(data: any) {
        if (data?.title && !data.slug) {
          data.slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        }
        return data;
      },
    });
  }
});
```

---

### Auth

Auth as a **service** plus **routes**:

```ts
export const AuthPlugin = () => createPlugin({
  meta: { name: "acme.auth", version: "0.1.0" },
  capabilities: [{ type: "auth", methods: ["jwt"] }, { type: "service", name: "auth" }],
  onSetup(ctx) {
    ctx.services.provide("auth", {
      async login(email: string, password: string) { /*...*/ return { token: "jwt-abc" }; },
      async verify(token: string) { /*...*/ return { sub: "user-1" }; },
    });
  },
  onStart(ctx) {
    // Warm any caches or keys here
  },
  onStop(ctx) {
    // Cleanup
  }
});

export const AuthRoutes = (base="/api/auth") => createPlugin({
  meta: { name: "acme.auth.routes", version: "0.1.0" },
  requires: ["acme.auth"],
  capabilities: [{ type: "routes", basePath: base }],
  onSetup(ctx) {
    const auth = ctx.services.require<{ login(e:string,p:string):Promise<any>; verify(t:string):Promise<any>; }>("auth");
    ctx.registries.routes.post(`${base}/login`, async (c: any) => {
      const { email, password } = await c.req.json();
      return await auth.login(email, password);
    });
    ctx.registries.routes.get(`${base}/me`, async (c: any) => {
      const token = c.req.header("authorization")?.replace(/^Bearer\\s+/i, "") ?? "";
      return await auth.verify(token);
    });
  }
});
```

---

### Action

```ts
export const PublishAction = () => createPlugin({
  meta: { name: "acme.action.publish", version: "0.1.0" },
  capabilities: [{ type: "action", name: "publishContent", triggers: ["manual"] }],
  onSetup(ctx) {
    ctx.registries.actions.register({
      name: "publishContent",
      async run({ id }: { id: string }) {
        // Publish logic here
        return { ok: true, id };
      }
    });
  }
});
```

---

### UI

The `"ui"` capability declares intent to extend UI areas. Actual rendering is app-specific; your plugin may simply declare capability + optionally register fields/actions/services that the UI consumes.

```ts
export const AdminUiPack = () => createPlugin({
  meta: { name: "acme.ui.admin", version: "0.1.0" },
  capabilities: [{ type: "ui", area: "adminPanel", components: ["ColorPickerPanel"] }],
  onSetup(ctx) {
    // Optionally register fields/actions used by your UI
  }
});
```

---

### Importer

```ts
export const CsvImporter = () => createPlugin({
  meta: { name: "acme.importer.csv", version: "0.1.0" },
  capabilities: [{ type: "importer", format: "csv", sources: ["file","url"] }],
  onSetup(ctx) {
    ctx.services.provide("import.csv", {
      async fromFile(file: ArrayBuffer) { /* parse & map */ },
      async fromUrl(url: string) { /* fetch & parse */ },
    });
  }
});
```

---

### Content Type

Declare as a capability and use fields/pipelines/services to implement behavior. Your app can discover and wire these.

```ts
export const BlogContent = () => createPlugin({
  meta: { name: "acme.content.blog", version: "0.1.0" },
  capabilities: [{ type: "content-type", name: "blogPost", fields: ["title","body","tags"] }],
  onSetup(ctx) {
    // Optionally: register supporting fields/pipelines
  }
});
```

---

### Hook & Middleware

Use `"hook"` for domain events and `"middleware"` for request/response intent. Implementation is app-specific; you can also piggyback on `pipelines` for structured stages.

```ts
export const AuditHook = () => createPlugin({
  meta: { name: "acme.hook.audit", version: "0.1.0" },
  capabilities: [{ type: "hook", event: "onSave", priority: 50 }],
  onSetup(ctx) {
    ctx.registries.pipelines.register({
      name: "auditOnSave",
      stage: "postProcess",
      async transform(data) { /* append audit log */ return data; },
    });
  }
});
```

---

### Storage Adapter

Expose as a service and declare capability:

```ts
export const S3Storage = () => createPlugin({
  meta: { name: "acme.storage.s3", version: "0.1.0" },
  capabilities: [{ type: "storage-adapter", provider: "s3", acl: "private" }, { type: "service", name: "storage" }],
  onSetup(ctx) {
    ctx.services.provide("storage", {
      async put(key: string, bytes: Uint8Array) { /* ... */ },
      async get(key: string) { /* ... */ return new Uint8Array(); },
      async del(key: string) { /* ... */ },
    });
  }
});
```

---

### Search Engine

```ts
export const AlgoliaSearch = () => createPlugin({
  meta: { name: "acme.search.algolia", version: "0.1.0" },
  capabilities: [{ type: "search-engine", engine: "algolia", indexes: ["posts","users"] }],
  onSetup(ctx) {
    ctx.services.provide("search", {
      async index(name: string, docs: any[]) { /* ... */ },
      async query(name: string, q: string) { /* ... */ return []; },
    });
  }
});
```

---

### Notification

```ts
export const Notify = () => createPlugin({
  meta: { name: "acme.notify", version: "0.1.0" },
  capabilities: [{ type: "notification", channels: ["email","in-app"] }],
  onSetup(ctx) {
    ctx.services.provide("notify", {
      async email(to: string, subject: string, html: string) { /* ... */ },
      async inApp(userId: string, msg: string) { /* ... */ },
    });
  }
});
```

---

### Scheduler

Start timers/jobs in `onStart` and teardown via `resources`:

```ts
export const CronJobs = () => createPlugin({
  meta: { name: "acme.jobs", version: "0.1.0" },
  capabilities: [{ type: "scheduler", tasks: ["cleanup"], cronExpressions: { cleanup: "0 3 * * *" } }],
  onStart(ctx) {
    const id = setInterval(() => {/* run cleanup */}, 24 * 60 * 60 * 1000);
    ctx.resources.set("daily-cleanup", () => clearInterval(id));
  }
});
```

---

### Localization

```ts
export const I18n = () => createPlugin({
  meta: { name: "acme.i18n", version: "0.1.0" },
  capabilities: [{ type: "localization", languages: ["en","pt-BR"], fallback: "en" }, { type: "service", name: "i18n" }],
  onSetup(ctx) {
    ctx.services.provide("i18n", {
      t(lang: string, key: string, vars?: Record<string, any>) { /* ... */ return key; }
    });
  }
});
```

---

### Theme

```ts
export const DarkTheme = () => createPlugin({
  meta: { name: "acme.theme.dark", version: "0.1.0" },
  capabilities: [{ type: "theme", name: "dark", areas: ["admin","frontend"], customizable: true }],
});
```

---

### Menu

```ts
export const MainMenu = () => createPlugin({
  meta: { name: "acme.menu.main", version: "0.1.0" },
  capabilities: [{ type: "menu", location: "mainNav", items: [{ label: "Home", path: "/" }] }],
});
```

---

### Permission

```ts
export const Roles = () => createPlugin({
  meta: { name: "acme.perms", version: "0.1.0" },
  capabilities: [{ type: "permission", roles: ["admin","editor"], actions: ["read","write"], resources: ["content","users"] }],
});
```

---

### Integration

```ts
export const StripeIntegration = () => createPlugin({
  meta: { name: "acme.integrations.stripe", version: "0.1.0" },
  capabilities: [{ type: "integration", service: "stripe", apiKeys: true, webhooks: true }, { type: "service", name: "stripe" }],
  onSetup(ctx) {
    ctx.services.provide("stripe", {
      async pay(amount: number, currency = "USD") { /* ... */ },
    });
  }
});
```

---

### Form

```ts
export const ContactForm = () => createPlugin({
  meta: { name: "acme.form.contact", version: "0.1.0" },
  capabilities: [{ type: "form", name: "contact", fields: ["name","email","message"], submissions: "db" }],
});
```

---

### Dashboard

```ts
export const OpsDashboard = () => createPlugin({
  meta: { name: "acme.dashboard.ops", version: "0.1.0" },
  capabilities: [{ type: "dashboard", panels: ["stats","errors"], metrics: ["users.count","errors.5xx"], accessLevel: "admin" }],
});
```

---

### Analytics

```ts
export const GtagAnalytics = () => createPlugin({
  meta: { name: "acme.analytics.gtag", version: "0.1.0" },
  capabilities: [{ type: "analytics", trackers: ["gtag"], events: ["pageview","cta"] }],
});
```

---

### SEO

```ts
export const SeoTools = () => createPlugin({
  meta: { name: "acme.seo", version: "0.1.0" },
  capabilities: [{ type: "seo", tools: ["metaTags","sitemaps","robots"], autoGenerate: true }],
});
```

---

### Cache

```ts
export const MemoryCache = () => createPlugin({
  meta: { name: "acme.cache.memory", version: "0.1.0" },
  capabilities: [{ type: "cache", provider: "memory", ttl: 300, scopes: ["global"] }, { type: "service", name: "cache" }],
  onSetup(ctx) {
    const map = new Map<string, any>();
    ctx.services.provide("cache", {
      get: (k: string) => map.get(k),
      set: (k: string, v: any) => { map.set(k, v); },
    });
  }
});
```

---

### Logger

```ts
export const RemoteLogger = () => createPlugin({
  meta: { name: "acme.logger.remote", version: "0.1.0" },
  capabilities: [{ type: "logger", levels: ["info","warn","error"], outputs: ["remote"] }],
  onSetup(ctx) {
    ctx.services.provide("logger.remote", {
      info: (...a: unknown[]) => {/* send to remote */},
    });
  }
});
```

---

### Error Handler

```ts
export const ErrorRedirects = () => createPlugin({
  meta: { name: "acme.errors.redirects", version: "0.1.0" },
  capabilities: [{ type: "error-handler", types: ["404","500"], redirects: { "404": "/not-found" } }],
});
```

---

### Webhook

```ts
export const OutgoingWebhooks = () => createPlugin({
  meta: { name: "acme.webhook.outgoing", version: "0.1.0" },
  capabilities: [{ type: "webhook", direction: "outgoing", events: ["content.published"] }],
  onSetup(ctx) {
    ctx.services.provide("webhooks", {
      async emit(event: string, payload: any) { /* POST to endpoints */ }
    });
  }
});
```

---

### Other / Custom

Define your own capability types under `"other"` with arbitrary metadata. The host can read and act on them later.

```ts
export const CustomCap = () => createPlugin({
  meta: { name: "acme.other.cool", version: "0.1.0" },
  capabilities: [{ type: "other", purpose: "whatever-you-need" } as any],
});
```

---

## Idempotency, Safety & Best Practices

- **Idempotent `onSetup`**: registries ignore duplicates; still, avoid double work.
- **No side effects at import time**: do everything in hooks.
- **Declare `requires/optional/conflicts`** to make ordering explicit and catch bad combos.
- **Keep handlers pure**; use per-request context (`c.get("services")`) instead of globals.
- **Use `resources.set()`** for timers/subscriptions and always clean up in `onStop`.
- **Validate inputs**; log useful errors via `ctx.app.logger`.
- **Document provided services** (name + TypeScript type) for consumers.

---

## Testing Plugins

- **Unit test** with fake registries (arrays) and a fake `ServiceRegistry`.
- **Contract test**: ensure your plugin’s `onSetup` is idempotent and registers expected items.
- **Integration test**: spin a tiny Hono app, mount routes from the store, hit endpoints.

Example of a fake registries harness:

```ts
const store = { db: [], fields: [], routes: [], actions: [], pipelines: [] };
const { app, registries, getEnv } = createPluginContext({
  version: "0.0.0-test", env: "test", store,
});

await MyPlugin().onSetup!({ meta: MyPlugin().meta, app, registries, getEnv, services: fakeServices, diagnostics: fakeDiag, resources: fakeRes });
expect(store.routes.length).toBeGreaterThan(0);
```

---

## Load Flow: Runtime & Orchestrator

**Where everything comes together**:

1. **Sanitize Config**: collections, fields, indexes.
2. **Create Plugin Context**: `createPluginContext` wires registries to the internal store.
3. **Orchestrate**: `buildRuntime({ app, plugins, registries, getEnv })`:
   - Validates `engines.pluginApi`, checks `conflicts`.
   - Topologically sorts by `requires`.
   - Runs `onValidate` (sync), then `onSetup` (register), then `onStart` (effects).
   - Exposes `services` (cross-plugin), `checkHealth`, `collectMetrics`, and `stop`.
4. **Mount**: the server reads `store.routes` and mounts them into Hono.
5. **Requests**: per-request middleware adds DB/schema-backed `services` (e.g., repos).
6. **Shutdown**: call `runtime.stop()`; orchestrator runs `onStop` in reverse order and disposes registered resources.

**Who does what?**
- `createPluginContext`: builds the **toolbox** (registries backed by store, env, logger snapshot).
- **Orchestrator**: manages **execution** (order, lifecycle, services, diagnostics, teardown).
- Your **plugin**: declares capabilities and uses the toolbox during hooks.

---

## FAQ

**Q: Can a plugin read environment variables?**  
A: Yes, via `ctx.getEnv("NAME")` (and you can scope access in your app if needed).

**Q: How do I share code between plugins?**  
A: Publish a service via `ctx.services.provide("name", impl)` and have consumers call `ctx.services.require("name")`.

**Q: How do I avoid duplicate routes in dev with hot reload?**  
A: Registries are idempotent and keep a set of keys; `onSetup` should be idempotent too.

**Q: Can I register middlewares instead of routes?**  
A: Declare a `"middleware"` capability for discovery. Depending on your app, either map that to router middlewares or use a pipeline stage to transform requests/responses.

**Q: Where do I perform long startup tasks?**  
A: In `onStart`, then register a disposer via `ctx.resources.set(...)` so `onStop` can clean up.

---

**Happy hacking! Build small, focused plugins with clear capabilities and services.**
