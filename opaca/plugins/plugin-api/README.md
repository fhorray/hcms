# Opaca Plugin API

The **Opaca Plugin API** allows you to extend the CMS with new functionality such as:

- Database adapters (e.g. D1, SQLite, PostgreSQL)
- Custom fields (with schema + admin UI components)
- Server routes
- Actions and background jobs
- UI panels in the admin interface
- Data transformers (sanitize, validate, lifecycle hooks)

This document explains how to author plugins, how the registries work, and how the core loads plugins.

---

## 📦 Plugin Manifest

Every plugin must export a **manifest** object conforming to `OpacaPluginManifest`.

```ts
export interface OpacaPluginManifest {
  meta: OpacaPluginMeta;
  capabilities?: Array<unknown>;
  onInstall?: (ctx: OpacaPluginContext) => void; // optional, sync only
  onLoad?: (ctx: OpacaPluginContext) => void; // optional, sync only
  onBeforeRequest?: (ctx: OpacaPluginContext, req: Request) => void;
  onAfterRequest?: (ctx: OpacaPluginContext, res: Response) => void;
  setup: (ctx: OpacaPluginContext) => void; // required, sync only
}
```

### Example

```ts
import type { OpacaPluginManifest } from '@opaca/plugin-api/types';

const ExamplePlugin = (): OpacaPluginManifest => ({
  meta: {
    name: 'example-plugin',
    version: '0.1.0',
    engines: { opaca: '^0.1.0' },
    description: 'A simple example plugin',
  },
  capabilities: [{ type: 'field', name: 'example' }],
  setup(ctx) {
    ctx.registries.fields.register({
      name: 'example',
      schema: { kind: 'string' },
      renderAdmin: ({ value, onChange }) => (
        <input
          className="border rounded p-2"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
        />
      ),
      sanitize: (v) => (v == null ? '' : String(v)),
    });
  },
});

export default ExamplePlugin;
```

---

## 🧩 Plugin Metadata

```ts
export interface OpacaPluginMeta {
  name: string;
  version: string;
  engines: { opaca: SemverRange }; // e.g. "^0.1.0"
  author?: string;
  homepage?: string;
  description?: string;
}
```

- `name`: unique identifier (recommended: `@scope/opaca-plugin-*`).
- `version`: plugin version (semver).
- `engines.opaca`: required Opaca version range.
- `author`, `homepage`, `description`: optional for docs.

---

## 🏗️ Plugin Context

Every plugin receives a `ctx: OpacaPluginContext` in its lifecycle hooks.

```ts
export interface OpacaPluginContext {
  version: string; // current Opaca version
  env: 'production' | 'development';
  log: {
    info: (...a: any[]) => void;
    warn: (...a: any[]) => void;
    error: (...a: any[]) => void;
  };
  registries: OpacaPluginRegistries;
  resources: { [k: string]: unknown }; // opt-in resources (db, cache, etc.)
}
```

---

## 📚 Registries

Plugins extend Opaca by **registering descriptors** into registries.

### Database Adapters

```ts
ctx.registries.db.register({
  name: 'd1',
  create: async (options) => drizzle(options.binding),
});
```

### Fields

```ts
ctx.registries.fields.register({
  name: 'color',
  schema: { kind: 'string', meta: { format: 'color' } },
  renderAdmin: ColorPickerComponent,
  sanitize: (v) => (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v) ? v : '#ffffff'),
});
```

Field schema:

```ts
export interface OpacaFieldSchema {
  kind: 'string' | 'number' | 'boolean' | 'json' | 'date';
  required?: boolean;
  default?: unknown;
  meta?: Record<string, unknown>;
}
```

### Routes

```ts
ctx.registries.routes.register({
  method: 'GET',
  path: '/plugins/example/health',
  handler: (_req: Request) =>
    new Response(JSON.stringify({ ok: true }), {
      headers: { 'content-type': 'application/json' },
    }),
});
```

### Actions

```ts
ctx.registries.actions.register({
  name: 'sendWelcomeEmail',
  run: async (input) => {
    // your action code
    return { sent: true };
  },
});
```

### UI Panels

```ts
ctx.registries.ui.registerPanel({
  id: 'custom-sidebar',
  slot: 'sidebar',
  component: SidebarComponent,
});
```

### Pipeline Transformers

```ts
ctx.registries.pipeline.register({
  id: 'slugify-title',
  stage: 'beforeSave',
  run: (input, ctx) => {
    input.slug = input.title.toLowerCase().replace(/\s+/g, '-');
    return input;
  },
});
```

---

## 🔄 Lifecycle Hooks

- **onLoad** → called when the plugin is loaded (sync only).
- **setup** → main entry point to register fields, routes, etc. (**required**).
- **onBeforeRequest** → optional, runs before handling a request.
- **onAfterRequest** → optional, runs after sending a response.

---

## ⚡ Plugin Loader

Opaca core loads plugins synchronously with `loadPlugins`.

```ts
const plugins = loadPlugins({
  ctx, // from createPluginContext()
  pluginSpecs: [ExamplePlugin()],
});
```

- Loader validates `engines.opaca`.
- Only synchronous hooks are supported.
- If a hook returns a `Promise`, the plugin is skipped.

---

## 🎨 Admin Rendering

Custom fields registered by plugins can be rendered in admin forms using a `<DynamicField />` component.

```tsx
<DynamicField
  type="color"
  label="Favorite Color"
  value={watch('color')}
  onChange={(v) => setValue('color', v)}
/>
```

The `renderAdmin` component provided by the plugin will be used automatically.

---

## ✅ Best Practices

- Keep plugins **small and focused**.
- Separate **server logic** (routes, adapters) and **admin UI** (fields, panels) into different entry files.
- Validate user input with `sanitize` and `validate` hooks.
- Declare `engines.opaca` properly to avoid version mismatches.
- Use `ctx.log` for consistent logging.

---

## 📖 Example Folder Structure

```
plugins/
  opaca-plugin-color-field/
    package.json
    src/
      index.ts         # server entry (setup, routes, fields)
      admin.tsx        # admin entry (renderAdmin, ui panels)
      README.md
```

---

## 🔒 Security Notes

- Plugins only receive a **narrowed context** (no raw environment).
- Always validate inputs in `sanitize`/`validate`.
- Avoid accessing sensitive data unless explicitly exposed in `ctx.resources`.

---

## 📝 License

Plugins are published independently. Please follow the license terms of the plugin you install.
