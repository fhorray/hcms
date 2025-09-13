import { Context, Hono, Next } from "hono";
import { createPlugin } from "../plugin-api/types";
import { Variables } from "@/opaca/types/hono";

/**
 * Authentication plugin providing user management and authentication services.
 * Depends on no other plugins.
 */
export const AuthPlugin = createPlugin({
  meta: {
    name: "opaca/auth",
    version: "0.1.0",
    engines: {
      pluginApi: "^0.1.0",
      app: "^0.1.0"
    },
    description: "Authentication and user management",
  },
  provides: ["opaca/auth"],
  capabilities: [{ type: "service", name: "auth" }],
  onSetup(ctx) {
    // 1 - Create the service object
    const svc = {
      async getUser(id: string) {
        // Fetch user by ID from database
        return { id, name: "Demo User" };
      },

      async verify(token: string) {
        // Verify user credentials
        return true
      },
    };
    /**
     * 2 - Register the service in the context for other plugins to use
     * Other plugins can access this service via ctx.services.get("auth")
     * and use svc.getUser() or svc.verify() as needed.
     * 
     * THis must match the "provides" field above.
     **/
    ctx.services.provide("opaca/auth", svc);

    // add diagnostics, metrics, resources if needed
    ctx.diagnostics.addHealthCheck("auth-backend", async () => ({ ok: true }));
    ctx.diagnostics.addMetric("auth-cache-size", async () => 0);

  }
})


/**
 * Authentication routes plugin, depends on "opaca/auth" service.
 * Provides routes for login, logout, registration, and password reset.
 */
export const AuthRoutesPlugin = createPlugin({
  meta: {
    name: "opaca/auth-routes",
    version: "0.1.0",
    engines: {
      pluginApi: "^0.1.0",
      app: "^0.1.0"
    },
    description: "Authentication routes (login, logout, register, password reset)",
    author: "Opaca"
  },
  requires: ["opaca/auth"],
  onSetup(ctx) {
    const { routes } = ctx.registries;
    const auth = ctx.services.require<{
      verify(token: string): Promise<boolean>;
    }>("opaca/auth");

    routes.get("/auth/login", async (c, next) => {
      const honoCtx = (c as Context<{
        Variables: Variables
      }>);


      // const { token } = await honoCtx.req.json();
      // const payload = await auth.verify(token);

      return honoCtx.json({ ok: true, sub: "payload" })
    })
  },
})