import type { OpacaPluginManifest } from "@opaca/plugins/plugin-api/types";
import { basicAuth } from "hono/basic-auth";
import { bearerAuth } from "hono/bearer-auth";
import { jwt } from "hono/jwt";
import { JwtPayload, OpacaAuthOptions } from "./types";
import { parseJwt, signJWT } from "./helpers";


const OpacaAuthPlugin = (opts: OpacaAuthOptions): OpacaPluginManifest => {
  const base = opts.basePath ?? "/plugins/opaca-auth";
  const cookieName = opts.cookieName ?? "opaca_token";
  const cookieSecure = opts.cookieSecure ?? (typeof process !== "undefined" ? process.env.NODE_ENV === "production" : true);
  const jwtExpires = opts.jwtExpiresIn ?? 60 * 60 * 24;

  return {
    meta: {
      name: "opaca-auth",
      version: "0.1.0",
      engines: { opaca: "^0.4" },
      description: "Auth plugin for Opaca using Hono Basic, Bearer and JWT guards.",
    },

    // Optional descriptor for discovery
    capabilities: [
      { type: "route", methods: ["GET", "POST"], basePath: base },
      { type: "auth", schemes: ["basic", "bearer", "jwt"] },
    ],

    onLoad(ctx) {
      ctx.log.info("[opaca-auth] loaded");
    },

    setup(ctx) {
      // 1) Optional: protect admin with Basic Auth
      if (opts.adminBasic) {
        const { username, password, realm } = opts.adminBasic;
        ctx.registries.routes.register({
          method: "ALL",
          path: "/admin/*",
          // Wrap a no-op handler guarded by Basic Auth; your router should compose it before admin handlers
          // See hono/basic-auth docs for usage
          handler: basicAuth({
            username,
            password,
            realm,
          }),
        });
      }

      // 2) Optional: Bearer token guard for machine-to-machine
      if (opts.bearerApiToken) {
        ctx.registries.routes.register({
          method: "ALL",
          path: "/api/private/*",
          handler: bearerAuth({
            token: opts.bearerApiToken,
          }),
        });
      }

      // 3) JWT guard that verifies either Authorization: Bearer <token> or cookie
      // The `jwt()` middleware can also be configured with { cookie: cookieName }
      const jwtGuard = jwt({
        secret: opts.jwtSecret,
        cookie: cookieName, // allow cookie-based auth automatically
      });

      // Example guarded route (API)
      ctx.registries.routes.register({
        method: "GET",
        path: `${base}/me`,
        handler: jwtGuard, // verify first
      });

      ctx.registries.routes.register({
        method: "GET",
        path: `${base}/me`,
        handler: (req) => {
          // After jwt middleware, claims are available on c.get("jwtPayload") in Hono handler
          // Here, plugin-level handler is a Fetch-like function; Opaca’s router will pass context.
          // We assume Opaca wraps to provide a Hono Context, exposing claims in request.locals if needed.
          // To keep this framework-agnostic, we simply echo a generic response.
          return new Response(JSON.stringify({ ok: true, user: "from-jwt" }), {
            headers: { "content-type": "application/json" },
          });
        },
      });

      // 4) Auth routes: login, logout, refresh
      // LOGIN: issue JWT and set httpOnly cookie
      ctx.registries.routes.register({
        method: "POST",
        path: `${base}/login`,
        handler: async (c, next) => {
          // Expect JSON body: { email, password }
          const { email, password } = await c.req.json() as { email?: string; password?: string };
          if (!email || !password) {
            return new Response(JSON.stringify({ ok: false, error: "Invalid credentials" }), {
              status: 400,
              headers: { "content-type": "application/json" },
            });
          }

          // Demo: accept any non-empty and set user id = email
          const token = await signJWT({ sub: email, email, roles: ["user"] }, opts.jwtSecret, jwtExpires);

          // Create response and attach cookie via Hono cookie helper semantics
          const res = new Response(JSON.stringify({ ok: true, token }), {
            headers: { "content-type": "application/json" },
          });

          // Create Session inside DB
          ctx.registries.db.register({
            name: "sessions",
            create: async (options) => {
              console.log({ options })
              // Implement your DB logic here; this is just a placeholder
              const data = options as { email: string; token: string; issuedAt: number; expiresAt: number };
              ctx.log.info(`[opaca-auth] create session for ${data.email}`);
              return { id: "session-id", ...data };
            }
          })

          // Use standard Set-Cookie; Opaca’s router can adapt this or you can rely on hono/cookie in handlers
          const cookieParts = [
            `${cookieName}=${token}`,
            `Path=/`,
            `HttpOnly`,
            `SameSite=Strict`,
            cookieSecure ? `Secure` : ``,
            opts.cookieDomain ? `Domain=${opts.cookieDomain}` : ``,
            `Max-Age=${jwtExpires}`,
          ].filter(Boolean);
          res.headers.append("Set-Cookie", cookieParts.join("; "));

          return res;
        },
      });


      // REFRESH: read cookie and re-issue a fresh token
      ctx.registries.routes.register({
        method: "POST",
        path: `${base}/refresh`,
        handler: async (c, next) => {
          // Using cookie header directly for portability
          const cookieHeader = c.req.header("cookie") ?? "";
          const current = cookieHeader
            .split(";")
            .map((c) => c.trim())
            .find((c) => c.startsWith(`${cookieName}=`));
          const token = current?.split("=").slice(1).join("=");

          if (!token) {
            return new Response(JSON.stringify({ ok: false, error: "No token" }), {
              status: 401,
              headers: { "content-type": "application/json" },
            });
          }

          // Let the jwt middleware verify normally; here we just issue a new token quickly
          // In a real app, decode and verify first; then re-issue with a new exp
          let email = "unknown";
          try {
            const payload = parseJwt(token) as JwtPayload | undefined;
            if (payload?.sub) email = payload.sub;
          } catch { }

          const newToken = await signJWT({ sub: email, email }, opts.jwtSecret, jwtExpires);
          const res = new Response(JSON.stringify({ ok: true, token: newToken }), {
            headers: { "content-type": "application/json" },
          });
          const cookieParts = [
            `${cookieName}=${newToken}`,
            `Path=/`,
            `HttpOnly`,
            `SameSite=Strict`,
            cookieSecure ? `Secure` : ``,
            opts.cookieDomain ? `Domain=${opts.cookieDomain}` : ``,
            `Max-Age=${jwtExpires}`,
          ].filter(Boolean);
          res.headers.append("Set-Cookie", cookieParts.join("; "));
          return res;
        },
      });

      // LOGOUT: clear cookie
      ctx.registries.routes.register({
        method: "POST",
        path: `${base}/logout`,
        handler: async () => {
          const res = new Response(JSON.stringify({ ok: true }), {
            headers: { "content-type": "application/json" },
          });
          // Expire the cookie
          res.headers.append(
            "Set-Cookie",
            `${cookieName}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0; ${cookieSecure ? "Secure;" : ""}${opts.cookieDomain ? ` Domain=${opts.cookieDomain};` : ""
            }`
          );
          return res;
        },
      });

      // 5) Example: protect `/api/*` with JWT but exclude login/refresh
      // In Hono, you can combine/except; Opaca’s router should mirror that when composing.
      ctx.registries.routes.register({
        method: "ALL",
        path: "/api/*",
        handler: jwtGuard,
      });

      ctx.log.info("[opaca-auth] routes and guards registered");
    },
  };
};

export default OpacaAuthPlugin;