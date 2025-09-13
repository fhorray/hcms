// opaca.config.ts (server-only module that builds and exports the config)
// Comments in English only.

import collections from "./collections";
import { defineOpacaConfig } from "./opaca/config";
import { D1Adapter } from "./opaca/db/adapters/d1";
import { AuthPlugin, AuthRoutesPlugin } from "./opaca/plugins/opaca-auth";

// Example plugins

const serverConfig = await defineOpacaConfig({
  collections,
  database: {
    dialect: "d1",
    adapter: D1Adapter({ devMode: process.env.NODE_ENV !== "production" }),
  },
  admin: {
    appName: "Opaca CMS",
    appDescription: "Example",
    appLang: "en",
    avatar: "dicebar",
    dateFormat: "DD/MM/YYYY",
  },
  plugins: [
    // LocalRoutesPlugin({ basePath: "/api/local" }),
    AuthPlugin,
    AuthRoutesPlugin,
  ],
});

// Default export: full server config (do NOT import this on the client)
export default serverConfig;

// Client-safe subset: no database/auth/registries/runtime internals
export const client: Pick<typeof serverConfig, "collections" | "admin" | "_index"> = {
  collections: serverConfig.collections,
  admin: serverConfig.admin,
  _index: serverConfig._index,
};