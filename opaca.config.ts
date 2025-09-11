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
    emailAndPassword: {
      enabled: true
    },
    socialProviders: {
      // google: {
      //   clientId: process.env.GOOGLE_CLIENT_ID as string,
      //   clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      // }
    },
    plugins: {
      admin: {
      },
      apiKey: {
        enabled: true,
        name: "Default",
        expiresIn: 60 * 60 * 24 * 30, // 30 days
        prefix: "opaca_",
        metadata: null,
        permissions: {
          // Give full access to all collections
          collections: ["*"],
        }
      }
    }
  },

})