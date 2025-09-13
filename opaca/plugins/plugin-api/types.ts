export const PLUGIN_API_VERSION = "0.1.0"; // protocol version, not app version

/**
 * A semantic version string, e.g. "1.2.3" or "^1.2.0"
 */
export type Semver = string;

/**
 * Metadata about your plugin, including version and compatibility info.
 * Use `engines` to specify compatible versions of the plugin API and/or host app.
 * Use `namespace` to reserve a unique namespace for your plugin to avoid collisions.
 * E.g., "opaca.auth" for the opaca-auth plugin.
 * See https://semver.org/ for versioning rules.
 */
export interface PluginMeta {
  /**
   * e.g. "opaca/my-plugin"
   */
  name: string;
  /**
   * e.g. "0.1.0"
   */
  version: Semver;                // plugin own version
  /**
   * e.g. { pluginApi: "^0.1.0", app: ">=1.0.0" }
   */
  engines?: { pluginApi?: Semver; app?: Semver };
  /**
   * e.g. "Your Name <
   */
  author?: string;            // e.g. "Your Name <
  /**
   * A short description of your plugin.
   */
  description?: string;
  // Optional namespace reservation to avoid collisions
  /**
   * e.g. "opaca.auth"
   */
  namespace?: string;             // e.g. "opaca.auth"
}


/**
 * Capabilities your plugin provides, for discovery and validation.
 * Use `type` to specify the kind of capability, e.g. "routes", "db-adapter", "field", "pipeline", etc.
 * Additional fields can be added as needed to describe the capability in more detail.
 * E.g., for a "db-adapter", you might include a `dialect` field to specify the database type.
 */
export type Capability =
  | {
    type: "routes";
    basePath?: string; // Optional base path for grouping routes
    methods?: ("GET" | "POST" | "PUT" | "DELETE" | "PATCH")[]; // Supported HTTP methods
    middleware?: string[]; // Array of middleware names to apply
  }
  | {
    type: "db-adapter";
    dialect: string; // Database dialect (e.g., "postgres", "mysql")
    schema?: string; // Optional schema name
    migrations?: boolean; // Whether the adapter handles migrations
    connectionOptions?: Record<string, any>; // Custom connection settings
  }
  | {
    type: "service";
    name: string; // Unique service identifier
    dependencies?: string[]; // Other services this depends on
    lifecycle?: "singleton" | "transient" | "scoped"; // Service lifetime
    interfaces?: string[]; // Interfaces or contracts implemented
  }
  | {
    type: "field";
    name: string; // Field type name (e.g., "richText", "imageGallery")
    validators?: string[]; // Array of validator functions or names
    uiComponent?: string; // Associated UI component for rendering/editing
    storage?: "db" | "file" | "external"; // Storage mechanism
  }
  | {
    type: "pipeline";
    stage: string; // Pipeline stage (e.g., "preProcess", "postRender")
    priority?: number; // Execution priority (lower numbers run first)
    conditions?: string[]; // Conditional expressions for when to apply
  }
  | {
    type: "auth";
    methods: string[]; // Authentication methods (e.g., "oauth", "jwt")
    providers?: string[]; // Supported providers (e.g., "google", "github")
    scopes?: string[]; // Required scopes or permissions
    tokenLifespan?: number; // Token expiration time in seconds
  }
  | {
    type: "ui";
    area: string; // UI area to extend (e.g., "adminPanel", "frontend")
    components?: string[]; // List of UI components provided
    themes?: string[]; // Supported themes or styles
    layouts?: string[]; // Custom layouts
  }
  | {
    type: "action";
    name: string; // Action name (e.g., "publishContent", "sendEmail")
    triggers?: ("manual" | "event" | "schedule")[]; // How the action is triggered
    inputs?: Record<string, string>; // Input parameters and their types
    outputs?: Record<string, string>; // Output values and their types
  }
  | {
    type: "widget";
    area: string; // Widget placement area (e.g., "dashboard", "sidebar")
    size?: "small" | "medium" | "large"; // Suggested widget size
    dataSources?: string[]; // Required data sources
    interactivity?: boolean; // Whether the widget supports user interaction
  }
  | {
    type: "report";
    name: string; // Report identifier (e.g., "userAnalytics")
    format: "pdf" | "csv" | "html" | "json"; // Output format
    dataQuery?: string; // Query or script to generate data
    schedule?: string; // Cron-like schedule for automated generation
  }
  | {
    type: "importer";
    format: string; // Data format (e.g., "csv", "json", "xml")
    sources?: ("file" | "url" | "db")[]; // Supported import sources
    mappings?: Record<string, string>; // Field mappings from source to target
    validationRules?: string[]; // Custom validation rules
  }
  | {
    type: "content-type";
    name: string; // Content type name (e.g., "blogPost", "product")
    fields: string[]; // Array of field names or references
    relations?: Record<string, string>; // Relationships to other content types
    workflows?: string[]; // Associated workflows
  }
  | {
    type: "hook";
    event: string; // Event to hook into (e.g., "onSave", "onDelete")
    priority?: number; // Execution order
    async?: boolean; // Whether the hook can run asynchronously
  }
  | {
    type: "middleware";
    appliesTo: "request" | "response" | "error"; // Middleware type
    routes?: string[]; // Specific routes to apply to
    order?: number; // Global execution order
  }
  | {
    type: "storage-adapter";
    provider: string; // Storage provider (e.g., "s3", "local")
    bucket?: string; // Bucket or directory name
    acl?: "public" | "private"; // Access control level
  }
  | {
    type: "search-engine";
    engine: string; // Search engine (e.g., "elasticsearch", "algolia")
    indexes?: string[]; // Indexes to manage
    queryEnhancers?: string[]; // Custom query enhancers
  }
  | {
    type: "notification";
    channels: ("email" | "sms" | "push" | "in-app")[]; // Supported channels
    templates?: string[]; // Template names
    triggers?: string[]; // Event triggers
  }
  | {
    type: "scheduler";
    tasks: string[]; // Task names or identifiers
    cronExpressions: Record<string, string>; // Cron schedules per task
  }
  | {
    type: "localization";
    languages: string[]; // Supported languages (e.g., "en", "fr")
    fallback?: string; // Default fallback language
    autoTranslate?: boolean; // Enable auto-translation
  }
  | {
    type: "theme";
    name: string; // Theme name
    areas: string[]; // Applicable areas (e.g., "frontend", "admin")
    customizable?: boolean; // Whether it supports customization
  }
  | {
    type: "menu";
    location: string; // Menu location (e.g., "mainNav", "footer")
    items: { label: string; path: string }[]; // Menu items
    dynamic?: boolean; // Whether menu is dynamically generated
  }
  | {
    type: "permission";
    roles: string[]; // Roles this applies to
    actions: string[]; // Allowed actions (e.g., "read", "write")
    resources: string[]; // Resources (e.g., "content", "users")
  }
  | {
    type: "integration";
    service: string; // Third-party service (e.g., "stripe", "mailchimp")
    apiKeys?: boolean; // Requires API keys
    webhooks?: boolean; // Supports incoming/outgoing webhooks
  }
  | {
    type: "form";
    name: string; // Form identifier
    fields: string[]; // Field references
    submissions?: "db" | "email" | "webhook"; // Submission handling
  }
  | {
    type: "dashboard";
    panels: string[]; // Dashboard panels or sections
    metrics?: string[]; // Key metrics to display
    accessLevel?: "admin" | "user" | "guest"; // Access restriction
  }
  | {
    type: "analytics";
    trackers: string[]; // Tracking providers (e.g., "googleAnalytics")
    events: string[]; // Custom events to track
    reports?: string[]; // Generated report types
  }
  | {
    type: "seo";
    tools: ("metaTags" | "sitemaps" | "robots")[]; // SEO tools provided
    autoGenerate?: boolean; // Auto-generate SEO elements
  }
  | {
    type: "cache";
    provider: string; // Cache provider (e.g., "redis", "memcached")
    ttl?: number; // Default time-to-live in seconds
    scopes?: ("global" | "user" | "session")[]; // Caching scopes
  }
  | {
    type: "logger";
    levels: ("debug" | "info" | "warn" | "error")[]; // Supported log levels
    outputs: ("console" | "file" | "remote")[]; // Log output destinations
  }
  | {
    type: "error-handler";
    types: string[]; // Error types handled (e.g., "404", "500")
    notifications?: boolean; // Notify on errors
    redirects?: Record<string, string>; // Error-specific redirects
  }
  | {
    type: "webhook";
    direction: "incoming" | "outgoing"; // Webhook direction
    endpoints?: string[]; // Endpoint URLs
    events: string[]; // Triggering events
  }
  | {
    type: "other";
    [key: string]: unknown; // Allow other custom capability types
  }


/**
 * A registry with read-only access to its items.
 * Provides methods to get, list, and check existence of items.
 */
export interface PluginDeps {
  requires?: string[];    // hard deps by plugin name
  optional?: string[];    // soft deps by plugin name
  conflicts?: string[];   // mutually exclusive plugins
  provides?: string[];    // service names you will provide
  consumes?: string[];    // service names you expect to consume
}

/**
 * Logger interface for logging at various levels.
 * TODO: implement a logging library or adapt an existing one.
 */
export interface Logger {
  debug: (...a: unknown[]) => void;
  info: (...a: unknown[]) => void;
  warn: (...a: unknown[]) => void;
  error: (...a: unknown[]) => void;
}

/**
 * Environment interface for accessing environment variables and bindings.
 * Extend this interface to include platform-specific bindings as needed.
 */
export interface AppEnviroment {
  NODE_ENV: "development" | "production" | "test";
  // abstract secrets/bindings behind interfaces if needed
  // Add platform-specific bindings (e.g., Cloudflare's D1) behind interfaces
}

/**
 * Plugin context provided to each plugin during its lifecycle methods.
 * Includes metadata, app config, registries, services, and helpers.
 */
export interface RouteRegistry {
  get(path: string, handler: (c: unknown, next: unknown) => unknown | Promise<unknown>): void;
  post(path: string, handler: (c: unknown, next: unknown) => unknown | Promise<unknown>): void;
  put(path: string, handler: (c: unknown, next: unknown) => unknown | Promise<unknown>): void;
  delete(path: string, handler: (c: unknown, next: unknown) => unknown | Promise<unknown>): void;
}

/**
 * Database adapter registry interface.
 * Allows registering and retrieving database adapters by dialect.
 */
export interface DbRegistry {
  registerAdapter(dialect: string, factory: () => unknown): void;
  getAdapter(dialect: string): unknown | undefined;
}

/**
 * Field type registry interface.
 * Allows registering and listing custom field types.
 */
export interface FieldRegistry {
  register(def: { name: string; schema: unknown; renderAdmin?: unknown; sanitize?: (v: unknown) => unknown; }): void;
  list(): Array<unknown>;
}

/**
 * Action registry interface.
 * Allows registering actions by name.
 */
export interface ActionRegistry {
  register(def: { name: string; run: (args: unknown) => Promise<unknown> }): void;
}

/**
 * Service registry interface for cross-plugin services.
 * Allows providing, getting, and requiring services by name.
 */
export interface ServiceRegistry {
  provide<T>(name: string, svc: T): void;
  get<T>(name: string): T | undefined;
  require<T>(name: string): T; // throws if missing
  has(name: string): boolean;
}

/**
 * Pipeline/transformer registry interface.
 * Allows registering and listing pipeline stages such as data transformers, validators, hooks, etc.
 */
export interface PipelineRegistry {
  register(def: { name: string; stage: string; transform: (data: unknown) => Promise<unknown> }): void;
  list(): Array<unknown>;
}

/**
 * Combined registries available in the plugin context.
 * Includes route, database, field, action, and service registries.
 */
export interface Registries {
  routes: RouteRegistry;
  db: DbRegistry;
  fields: FieldRegistry;
  actions: ActionRegistry;
  services: ServiceRegistry; // backed by the orchestrator
  pipelines: PipelineRegistry;
  // Add others (pipelines, transformers, auth, events, ui...)
}

/**
 * Application configuration provided to plugins.
 * Includes app version, environment, logger, and optional user config.
 */
export interface AppConfig {
  version: Semver; // your library/app version
  env: AppEnviroment;
  logger: Logger;
  features?: Record<string, unknown>;
  // app/user config that plugins may read (read-only snapshot)
  userConfig?: Record<string, unknown>;
}

/**
 * The main plugin context interface provided to plugins[].
 * Includes metadata, app config, registries, services, diagnostics, and resource management.
 */
export interface PluginContext {
  meta: PluginMeta;     // self metadata
  app: AppConfig;       // logger, env, flags
  registries: Registries;
  // Permission-scoped helpers:
  getEnv<T = unknown>(key: string): T | undefined;
  // Cross-plugin services:
  services: ServiceRegistry;
  // Diagnostics:
  diagnostics: {
    addHealthCheck(name: string, fn: () => Promise<{ ok: boolean; info?: unknown }>): void;
    addMetric(name: string, fn: () => Promise<number>): void;
  };
  // Guarded resource allocation:
  resources: {
    set(name: string, disposer: () => Promise<void> | void): void; // orchestrator will call onStop
  };
}
/**
 * Lifecycle methods for plugin integration with the application lifecycle.
 *
 * @method onValidate - Performs synchronous validation of configuration and environment.
 *   Avoid network or filesystem calls to ensure performance.
 * @method onSetup - Registers capabilities such as routes, fields, and services.
 *   Must be fast and idempotent.
 * @method onStart - Initializes background jobs, caches, and schedulers.
 *   Supports asynchronous operations.
 * @method onStop - Executes graceful teardown, reversing operations from onStart.
 *   Supports asynchronous operations.
 */
export interface PluginLifecycle {
  /**
   * Synchronous validation of configuration and environment.
   * Avoid network or filesystem operations.
   */
  onValidate?(ctx: PluginContext): void;

  /**
   * Registers capabilities such as routes, fields, and services.
   * Must be idempotent and performant.
   */
  onSetup?(ctx: PluginContext): void | Promise<void>;

  /**
   * Initializes background jobs, caches, and schedulers.
   * Can be asynchronous.
   */
  onStart?(ctx: PluginContext): void | Promise<void>;

  /**
   * Performs graceful teardown, reversing onStart operations.
   * Can be asynchronous.
   */
  onStop?(ctx: PluginContext): void | Promise<void>;
}


/**
 * The complete plugin manifest interface combining metadata, lifecycle methods, and dependencies.
 * Includes optional configuration hook for pre-parsing user options.
 */
export interface PluginManifest extends PluginLifecycle, PluginDeps {
  /**
   * Metadata about the plugin, including name, version, and compatibility info.
   */
  meta: PluginMeta;
  /**
   * Capabilities provided by the plugin for discovery and validation.
   */
  capabilities?: Capability[];
  /**
   * #OPTIONAL
   * Configures the plugin with user-provided options.
   * @param userOpts User-provided options for configuring the plugin.
   * This method allows pre-parsing and validating user options before the plugin is fully initialized.
   */
  configure?(userOpts?: unknown): void;
}

/**
 * @param p The plugin manifest object to define.
 * @returns The same plugin manifest object, for type inference.
 */
export function createPlugin<P extends PluginManifest>(p: P): P { return p; }