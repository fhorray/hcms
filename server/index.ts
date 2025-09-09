import collections from "@/cms/collections";
import * as schema from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { getDb } from "./db";

type Bindings = { DB: D1Database };
const api = new Hono<{ Bindings: Bindings }>().basePath('/api');

// CRUD ROUTES
for (const [key, col] of Object.entries(schema)) {
  // GET /api/<collection>
  api.get(`/${key}`, async (c) => {
    const db = getDb()
    const all = await db.select().from(col).all();
    return c.json(all);
  });

  // POST /api/<collection>
  api.post(`/${key}`, async (c) => {
    const db = getDb()
    const data = await c.req.json();
    console.log(data)
    // verify if any field from data is a json object and convert to string
    for (const [k, v] of Object.entries(data)) {
      if (v && typeof v === 'object') {
        data[k] = JSON.stringify(v);
      }
    }
    const [res] = await db.insert(col).values(data).returning();
    return c.json(res);
  });

  // GET /api/<collection>/:id
  api.get(`/${key}/:id`, async (c) => {
    const db = getDb()
    const { id } = c.req.param();
    const item = await db.select().from(col).where(eq(col.id, id)).get();
    if (!item) return c.json({ error: 'Not found' }, 404);
    return c.json(item);
  });

  // PUT /api/<collection>/:id
  api.put(`/${key}/:id`, async (c) => {
    const db = getDb()
    const { id } = c.req.param();
    const data = await c.req.json();
    const [res] = await db.update(col).set(data).where(eq(col.id, id)).returning();
    if (!res) return c.json({ error: 'Not found' }, 404);
    return c.json(res);
  });

  // DELETE /api/<collection>/:id
  api.delete(`/${key}/:id`, async (c) => {
    const db = getDb()
    const { id } = c.req.param();
    const [res] = await db.delete(col).where(eq(col.id, id)).returning();
    if (!res) return c.json({ error: 'Not found' }, 404);
    return c.json(res);
  });
}

api.get("/_schema/:resource", (c) => {
  const name = c.req.param("resource");

  if (!(schema as any)[name]) {
    return c.json({ error: 'Not found' }, 404);
  }
  const data = collections.collections.find((f) => f.name.toLowerCase() === name.toLowerCase())

  return c.json({ ...data });

});


export default api;