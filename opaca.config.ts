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
  }
})