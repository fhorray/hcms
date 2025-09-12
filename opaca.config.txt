import collections from "@/collections";
import { buildOpacaConfig } from "./cms/config";

export default buildOpacaConfig({
  collections,
  admin: {
    appName: "Opaca CMS",
    appDescription: "A Headless CMS, Simple & Opacaful! 🚀",
    avatar: 'dicebar',
    dateFormat: 'dd/MM/yyyy',
    theme: "dark",
    suppressHydrationWarning: true,
  },
  auth: {
    baseURL: process.env.OPACA_BASE_URL || "http://localhost:3000",
    emailAndPassword: {
      enabled: true
    },
    socialProviders: {
      // google: {
      //   clientId: process.env.GOOGLE_CLIENT_ID as string,
      //   clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      // }
    },
    plugins: [
      // TODO pass plugins as object with booleans instead of array
      // admin(),
      // nextCookies()
    ]
  }
})