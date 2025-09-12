// auth.ts

import { opacaBetterAuth } from "@/opaca/plugins/opaca-auth/factory";



export const auth = opacaBetterAuth({
  d1: { bindingName: "DB", camelCase: true },
  betterAuth: {
    basePath: "/auth",
  },
});
