
import { Hono } from "hono";
import type { OpacaDbAdapter } from "@/opaca/db/adapter";
import * as schema from "@/schema";
import type { Table } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { isDrizzleTable, parseId, resolveResult } from "./helpers";
import { UniversalDb } from "../db/types";

export function buildOpacaApi(adapter: OpacaDbAdapter) {
  const api = new Hono().basePath("/api");

  api.get("/", (c) => c.json({ status: "ok", message: "Welcome to Opaca CMS API" }));

  for (const [tableName, maybeTable] of Object.entries(schema)) {

    // if (!isDrizzleTable(maybeTable)) continue;


    const tbl = maybeTable as Table;

    // List all
    api.get(`/${tableName}`, async (c) => {
      const db = (await adapter.getDb()) as unknown as UniversalDb;
      const rows = await resolveResult(db.select().from(tbl));
      return c.json(rows);
    });

    // Get by id
    api.get(`/${tableName}/:id`, async (c) => {
      const idCol = (tbl as any).id;
      if (!idCol) return c.json({ error: "Table has no 'id' column" }, 400);

      const db = (await adapter.getDb()) as unknown as UniversalDb;
      const whereId = eq(idCol, parseId(c.req.param("id")));
      const rows = await resolveResult(db.select().from(tbl).where(whereId).limit(1));
      if (!rows?.length) return c.json({ error: "Not found" }, 404);
      return c.json(rows[0]);
    });

    // Create
    api.post(`/${tableName}`, async (c) => {
      const data = await c.req.json();
      const db = (await adapter.getDb()) as unknown as UniversalDb;
      const rows = await resolveResult(db.insert(tbl).values(data).returning());
      return c.json(rows?.[0] ?? null, 201);
    });

    // Update
    api.put(`/${tableName}/:id`, async (c) => {
      const idCol = (tbl as any).id;
      if (!idCol) return c.json({ error: "Table has no 'id' column" }, 400);

      const data = await c.req.json();
      const db = (await adapter.getDb()) as unknown as UniversalDb;
      const whereId = eq(idCol, parseId(c.req.param("id")));
      const rows = await resolveResult(db.update(tbl).set(data).where(whereId).returning());
      if (!rows?.length) return c.json({ error: "Not found" }, 404);
      return c.json(rows[0]);
    });

    // Delete
    api.delete(`/${tableName}/:id`, async (c) => {
      const idCol = (tbl as any).id;
      if (!idCol) return c.json({ error: "Table has no 'id' column" }, 400);

      const db = (await adapter.getDb()) as unknown as UniversalDb;
      const whereId = eq(idCol, parseId(c.req.param("id")));
      const rows = await resolveResult(db.delete(tbl).where(whereId).returning());
      if (!rows?.length) return c.json({ error: "Not found" }, 404);
      return c.json({ success: true, deleted: rows[0] });
    });
  }

  return api;
}