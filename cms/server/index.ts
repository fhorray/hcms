import collections from "@/collections";
import * as schema from "@/cms/server/db/schema";
import { AnyTable, eq } from "drizzle-orm";
import { Hono } from "hono";
import { getDbD1, getDbPg, runtime } from "./db";

type Bindings = {};
const api = new Hono<{ Bindings: Bindings }>().basePath('/api');

api.get("/", (c) => c.json({ status: "ok", message: "Welcome to Opaca CMS API" }));

api.get("/_schema/:resource", (c) => {
  const name = c.req.param("resource");

  if (!(schema as any)[name]) {
    return c.json({ error: 'Not found' }, 404);
  }
  const data = Object.values(collections).find((f) => f.name.toLowerCase() === name.toLowerCase())

  return c.json({ ...data });

});



// CRUD ROUTES
// --- SQLITE-LIKE (D1/sqlite) ---
if (runtime === "sqlite" || runtime === "d1") {
  const db = getDbD1(); // typed as D1 DB

  for (const [key, col] of Object.entries(schema)) {
    api.get(`/${key}`, async (c) => {
      const rows = await db.select().from(col as any).all(); // .all() exists here
      return c.json(rows);
    });

    api.post(`/${key}`, async (c) => {
      const data = await c.req.json();
      for (const [k, v] of Object.entries(data)) if (v && typeof v === "object") data[k] = JSON.stringify(v);
      // D1: returning() pode não existir. Se precisar do item, faça um select depois.
      await db.insert(col as any).values(data);
      return c.json({ ok: true });
    });

    api.get(`/${key}/:id`, async (c) => {
      const id = c.req.param("id");
      const row = await db.select().from(col as any).where(eq((col as any).id, id)).get(); // .get()
      if (!row) return c.json({ error: "Not found" }, 404);
      return c.json(row);
    });

    api.put(`/${key}/:id`, async (c) => {
      const id = c.req.param("id");
      const data = await c.req.json();
      await db.update(col as any).set(data).where(eq((col as any).id, id)); // no returning
      return c.json({ ok: true });
    });

    api.delete(`/${key}/:id`, async (c) => {
      const id = c.req.param("id");
      await db.delete(col as any).where(eq((col as any).id, id));
      return c.json({ ok: true });
    });
  }
}

// --- POSTGRES ---
if (runtime === "pg") {
  const db = getDbPg(); // typed as PG DB

  for (const [key, col] of Object.entries(schema)) {
    api.get(`/${key}`, async (c) => {
      const rows = await db.select().from(col as any); // no .all() in PG
      return c.json(rows);
    });

    api.post(`/${key}`, async (c) => {
      const data = await c.req.json();
      const inserted = await db.insert(col as any).values(data).returning();
      return c.json(inserted ?? inserted);
    });

    api.get(`/${key}/:id`, async (c) => {
      const id = c.req.param("id");
      const rows = await db.select().from(col as any).where(eq((col as any).id, id)).limit(1);
      const row = rows[0] ?? null;
      if (!row) return c.json({ error: "Not found" }, 404);
      return c.json(row);
    });

    api.put(`/${key}/:id`, async (c) => {
      const id = c.req.param("id");
      const data = await c.req.json();
      const updated = await db.update(col as any).set(data).where(eq((col as any).id, id)).returning();
      const row = updated[0] ?? null;
      if (!row) return c.json({ error: "Not found" }, 404);
      return c.json(row);
    });

    api.delete(`/${key}/:id`, async (c) => {
      const id = c.req.param("id");
      const deleted = await db.delete(col as any).where(eq((col as any).id, id));
      const row = deleted ?? null;
      if (!row) return c.json({ error: "Not found" }, 404);
      return c.json(row);
    });
  }
}



export default api;