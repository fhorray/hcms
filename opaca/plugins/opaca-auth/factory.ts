// cms/plugins/opaca-auth/opaca-better-auth.ts
// English-only comments.

import { betterAuth } from "better-auth";
import type { Kysely } from "kysely";
import type { OpacaBetterAuthServerLike } from "@opaca/plugins/opaca-auth/types";

// Soft import to avoid bundling issues when not on CF:
let getCloudflareContext: undefined | ((...a: any[]) => any);
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  getCloudflareContext = require("@opennextjs/cloudflare").getCloudflareContext;
} catch { }

type MaybePromise<T> = T | Promise<T>;

export interface OpacaBetterAuthOptions {
  database?: Kysely<any> | (() => MaybePromise<Kysely<any>>);
  d1?: { bindingName?: string; camelCase?: boolean };
  globalDbKey?: string;
  betterAuth: Omit<Parameters<typeof betterAuth>[0], "database">;
}

export function opacaBetterAuth(opts: OpacaBetterAuthOptions): OpacaBetterAuthServerLike {
  let _dbPromise: Promise<Kysely<any>> | null = null;
  let _authPromise: Promise<ReturnType<typeof buildServerLike>> | null = null;

  function ensure<T>(v: T | undefined | null, msg: string): T {
    if (v == null) throw new Error(msg);
    return v;
  }

  async function resolveDb(): Promise<Kysely<any>> {
    if (_dbPromise) return _dbPromise;
    _dbPromise = (async () => {
      if (opts.database) {
        return typeof opts.database === "function" ? await opts.database() : opts.database;
      }
      if (opts.d1 && getCloudflareContext) {
        const [{ Kysely, CamelCasePlugin }, { D1Dialect }] = await Promise.all([
          import("kysely").then((m) => ({ Kysely: m.Kysely, CamelCasePlugin: m.CamelCasePlugin })),
          import("kysely-d1"),
        ]);
        const binding = opts.d1.bindingName ?? "DB";
        const camel = opts.d1.camelCase ?? true;
        const ctx = await getCloudflareContext!({ async: true });
        const d1 = ensure(ctx.env[binding], `[opaca-better-auth] D1 binding "${binding}" not found`);
        const plugins = camel ? [new CamelCasePlugin()] : [];
        return new Kysely({ dialect: new D1Dialect({ database: d1 }), plugins });
      }
      if (opts.globalDbKey && (globalThis as any)[opts.globalDbKey]) {
        return (globalThis as any)[opts.globalDbKey] as Kysely<any>;
      }
      throw new Error(
        "[opaca-better-auth] No database. Provide `database`, `d1`, or `globalDbKey`."
      );
    })();
    return _dbPromise;
  }

  async function resolveAuth(): Promise<OpacaBetterAuthServerLike> {
    if (_authPromise) return _authPromise;
    _authPromise = (async () => {
      const db = await resolveDb();
      return buildServerLike(db, opts.betterAuth);
    })();
    return _authPromise;
  }

  function buildServerLike(db: Kysely<any>, conf: OpacaBetterAuthOptions["betterAuth"]) {
    const inst = betterAuth({
      ...conf,
      // Better Auth kysely adapter expects a Kysely-like client
      database: db,
    });

    // Wrap to GUARANTEE Response / null (no undefined).
    const serverLike: OpacaBetterAuthServerLike = {
      handler: (req: Request) =>
        Promise.resolve(inst.handler(req)).then(
          (r) => r ?? new Response(null, { status: 204 }) // never undefined
        ),
      api: {
        getSession: (args) =>
          Promise.resolve(inst.api.getSession(args as any)).then((r) => r ?? null),
      },
      utils: {
        ready: async () => {
          void db;
        },
      },
      // temporary backward-compat
      utilsts: {
        ready: async () => {
          void db;
        },
      },
    };
    return serverLike;
  }

  // Return a sync object with async internals: types still match (Promise<Response> allowed).
  return {
    handler: (req: Request) => resolveAuth().then((a) => a.handler(req)),
    api: {
      getSession: (args) => resolveAuth().then((a) => a.api.getSession(args)),
    },
    utils: {
      ready: async () => {
        await resolveAuth();
      },
    },
    // temporary backward-compat
    utilsts: {
      ready: async () => {
        await resolveAuth();
      },
    },
  };
}
