import { createSelectSchema } from "drizzle-zod";
import { buildConfig } from "./new-cms/config/build";
import * as schema from "@/server/db/schema";
import { zodFromDrizzleSchema } from "./new-cms/config/zod-from-drizzle";
import { SchemaType } from "./new-cms/config/types";

export default buildConfig({
  schema: schema as SchemaType,
  admin: {
    lang: 'pt-BR',
    title: 'Meu CMS',
    theme: 'dark',
    roles: ['admin', 'editor', 'viewer'],
  },
  email: {
    provider: 'smtp',
    from: 'no-reply@meucms.com',
    options: {
      host: 'smtp.gmail.com',
      port: 465,
    },
  },
  editor: {
    type: 'markdown',
  },
  cookiePrefix: 'opaca',
})