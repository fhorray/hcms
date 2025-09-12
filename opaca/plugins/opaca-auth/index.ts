// plugins/opaca-auth/src/index.ts
// English-only comments.
//
// "opaca-auth" plugin for the Opaca Plugin API.
// Providers supported in the API surface: "better-auth" | "nextauth"
// Current implementation: "better-auth" only.
//
// Responsibilities:
// - Mount Better Auth handler at `${basePath}/*` (default: /api/auth/*)
// - Add a tiny "/api/me" route to inspect the current user/session
// - Register an action "auth.getSession" you can call from elsewhere
// - Expose a minimal "requireAuth" route factory to protect routes (via wrapper)

import { Variables } from "@/opaca/types/hono";
import type {
  OpacaPluginManifest,
  OpacaPluginContext,
} from "@opaca/plugins/plugin-api/types";
import { BetterAuthOptions } from "better-auth";
import { Context } from "hono";

// Minimal shape to avoid a hard dependency on Better Auth's types:
export type OpacaBetterAuthServerLike = {
  // Main request handler (Hono will call it with the raw Request)
  handler: (req: Request) => Response | Promise<Response>;
  // Server-side API for reading the session from headers
  api: {
    getSession: (args: {
      headers: Headers;
      query?: Record<string, any>;
    }) => Promise<
      | {
        user: unknown;
        session: unknown;
        // If you use custom session fields in Better Auth, they will appear here.
      }
      | null
    >;
  };
};

export type OpacaProviderKind = "better-auth" | "nextauth";

export interface OpacaAuthPluginOptions {
  provider: OpacaProviderKind;
  // Only used when provider === "better-auth"
  instance?: OpacaBetterAuthServerLike;
  // Optional base path for the auth routes (default "/api/auth")
  basePath?: string;
  // If true, register a "/api/me" helper
  exposeMeRoute?: boolean;
}

function assert(condition: any, msg: string): asserts condition {
  if (!condition) throw new Error(`[opaca-auth] ${msg}`);
}

/**
 * Helper to create a simple "requireAuth" wrapper for route handlers.
 * It uses the "auth.getSession" action registered by this plugin under the hood.
 */
function makeRequireAuth(ctx: OpacaPluginContext) {
  return (handler: (req: Request, user: unknown, session: unknown) => Promise<Response> | Response) =>
    async (req: Request) => {
      const action = ctx.registries.actions.get("auth.getSession");
      assert(action, `Missing action "auth.getSession". Is the plugin loaded?`);

      const { user, session } = (await action.run({ headers: req.headers })) as {
        user: unknown | null;
        session: unknown | null;
      };

      if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        });
      }
      return handler(req, user, session);
    };
}

const OpacaAuthPlugin = (opts: OpacaAuthPluginOptions): OpacaPluginManifest => {
  const meta: OpacaPluginManifest["meta"] = {
    name: "opaca-auth",
    version: "0.1.0",
    engines: { opaca: "^0.1.0" },
    description: "Auth routing glue for Opaca (Better Auth implemented; NextAuth TBD).",
    author: "You",
    homepage: "https://your-repo.example.com",
  };

  // Validate options synchronously (Plugin API only allows sync lifecycle).
  const basePath = (opts.basePath ?? "/api/auth").replace(/\/+$/, "");
  const mountGlob = `${basePath}/*`;
  const exposeMeRoute = opts.exposeMeRoute ?? true;

  if (opts.provider === "better-auth") {
    assert(opts.instance, `Provider "better-auth" requires a "betterAuth" instance.`);
  }

  return {
    meta,
    capabilities: [{ type: "routes" }, { type: "actions" }],
    // Optional sync hooks
    onLoad() {
      // Nothing to do here yet
    },
    // Required by the Plugin API: sync setup to register routes/actions
    setup(ctx) {
      // Register routes & actions based on the selected provider
      if (opts.provider === "better-auth") {
        const auth = opts.instance!;
        // 1) Core auth handler route: delegate raw Request to Better Auth
        ctx.registries.routes.register({
          method: "ALL", // convenience: core can map to GET/POST/OPTIONS, etc.
          path: mountGlob,
          handler: (req) => auth.handler(req as Request),
        });

        // 2) Action to resolve the current session for any other server code
        ctx.registries.actions.register({
          name: "auth.getSession",
          run: async (input: { headers: Headers }) => {
            try {
              const ses = await auth.api.getSession({ headers: input.headers });
              return {
                user: ses?.user ?? null,
                session: ses?.session ?? null,
              };
            } catch (e) {
              ctx.log.warn("[opaca-auth] getSession failed:", e);
              return { user: null, session: null };
            }
          },
        });

        // 3) Optional helper route to quickly inspect the session
        if (exposeMeRoute) {
          ctx.registries.routes.register({
            method: "GET",
            path: "/api/me",
            handler: async (c) => {
              const action = ctx.registries.actions.get("auth.getSession");
              const { user, session } = (await action?.run({ headers: (c as Request).headers })) as {
                user: unknown | null;
                session: unknown | null;
              };
              return new Response(JSON.stringify({ user, session }), {
                status: 200,
                headers: { "content-type": "application/json" },
              });
            },
          });
        }

        // 4) Expose a requireAuth route-factory via a lightweight capability record
        // Consumers can discover it via the registry or via ctx.resources if the core exposes it.
        ctx.registries.actions.register({
          name: "auth.requireAuth.factory",
          run: async () => {
            // We return a string key; consumers in your code can import makeRequireAuth, too.
            return { key: "opaca-auth/requireAuth" };
          },
        });

        // (Optional) If your core supports sharing helpers through ctx.resources,
        // you can store raw helpers there for later use:
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (ctx.resources as any)["opaca-auth"] = {
          requireAuth: makeRequireAuth(ctx),
          basePath,
        };

        ctx.log.info(`[opaca-auth] Better Auth mounted at ${mountGlob}`);
      } else if (opts.provider === "nextauth") {
        // Placeholder for a future NextAuth implementation.
        ctx.log.warn(`[opaca-auth] "nextauth" provider not implemented yet. Skipping routes.`);
      } else {
        ctx.log.warn(`[opaca-auth] Unknown provider "${String(opts.provider)}" – skipping.`);
      }
    },
  };
};

export default OpacaAuthPlugin;
