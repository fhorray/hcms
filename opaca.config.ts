import { D1Adapter } from "@/opaca/db/adapters/d1";
import { defineOpacaConfig } from "@opaca/config";
import collections from "./collections";
import { OpacaPluginManifest } from "@opaca/plugins/plugin-api/types";
import { OpacaBuiltConfig } from "@opaca/types/config";
import OpacaAuthPlugin from "./opaca/plugins/opaca-auth";
import { auth } from "./lib/auth";


// PLUGIN EXAMPLE
// const LocalRoutes = (opts: { basePath?: string } = {}): OpacaPluginManifest => {
//   const base = opts.basePath ?? "/plugins/local";

//   // IMPORTANT: match this to your ctx.version (e.g., "0.1.0")
//   return {
//     meta: {
//       name: "local-routes",
//       version: "0.0.1",
//       engines: { opaca: "^0.1.0" },
//       description: "Example local plugin that registers a field and a GET route.",
//     },

//     // Optional, only for introspection/docs
//     capabilities: [
//       { type: "field", name: "example" },
//       { type: "route", methods: ["GET"], basePath: base },
//     ],

//     // Sync-only hooks for your strict sync loader
//     setup(ctx) {
//       // ctx.registries.fields.register({
//       //   name: "example",
//       //   schema: { kind: "string" },
//       //   renderAdmin: ExampleField,
//       //   sanitize: (v) => (v == null ? "" : String(v)),
//       // });

//       // --- Register a GET route under the plugin base path ---
//       ctx.registries.routes.register({
//         method: "GET",
//         path: `${base}/health`,
//         handler: (c) => {
//           return c.json({ status: "ok", timestamp: Date.now() })
//         },
//       });
//     },
//   };
// };

const serverConfig = defineOpacaConfig({
  collections,
  database: {
    dialect: "d1",
    adapter: D1Adapter({
      devMode: process.env.NODE_ENV === "development",
    }),
  },
  admin: {
    appName: "Opaca CMS",
    appDescription: "An example Opaca CMS project",
    appLang: "en",
    avatar: "dicebar",
    dateFormat: "DD/MM/YYYY",
  },
  plugins: [
    OpacaAuthPlugin({
      provider: "better-auth",
      instance: auth,
      basePath: "/api/auth",
    })
  ]
});

export const client = {
  collections: serverConfig.collections,
  admin: serverConfig.admin,
  _index: serverConfig._index,
} as OpacaBuiltConfig


export default serverConfig;


