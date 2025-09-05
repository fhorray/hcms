import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { posts } from "./db/schema";
import { getCloudflareContext } from "@opennextjs/cloudflare";

type Bindings = { DB: D1Database };
const api = new Hono<{ Bindings: Bindings }>().basePath('/api');;

api.get("/posts", async (c) => {
  const db = drizzle(getCloudflareContext().env.DB);
  const all = await db.select().from(posts).all();
  return c.json(all);
});

api.get("/_schema/:resource", (c) => {
  const name = c.req.param("resource");
  console.log(name)
  // encontre no array e retorne fields
  // (em prod, valide, cacheie, etc.)
  // ...
  return c.json({ name });
});

api.post("/posts", async (c) => {
  const body = await c.req.json<{ title: string; content?: string }>();
  const db = drizzle(c.env.DB);
  await db.insert(posts).values({ title: body.title, content: body.content }).run();
  return c.json({ ok: true });
});


export default api;