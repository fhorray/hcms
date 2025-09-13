import { OpacaBuiltConfig } from "@opaca/types/config";
import { Hono } from "hono";
import { Variables } from "../types/hono";

export function mountPluginsRest(app: Hono<{
  Variables: Variables
}>, config: OpacaBuiltConfig) {

  // TODO: security checks, e.g. only allow certain basePaths, etc.
  for (const route of config._registries.routes) {
    console.log(route.hanfler)
    app.on(route.method, route.path, async (c, next) => {

      return await route.handler(c, next);
    })
  }
}