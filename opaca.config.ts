
import { D1Adapter } from "@/opaca/db/adapters/d1";
import { defineOpacaConfig } from "@opaca/config";
import collections from "./collections";

export default defineOpacaConfig({
  collections,
  database: {
    dialect: "d1",
    adapter: D1Adapter({
      devMode: process.env.NODE_ENV === "development",
    }),
  },
  admin: {
    appName: "My Opaca CMS",
    appDescription: "An example Opaca CMS project",
    appLang: "en",
    avatar: "gravatar",
    dateFormat: "DD/MM/YYYY",
  }
});
