import { slugify } from "@/lib/utils";
import { OpacaCollection } from "@opaca/types/config";
import { Hono } from "hono";
import { Variables } from "../types/hono";

export function mountRest(app: Hono<{
  Variables: Variables
}>, cols: OpacaCollection[]) {

  for (const col of cols.filter(c => c.rest)) {
    const slug = slugify(col.name);
    const base = `/${slug}`;
    const pk = "id";

    app.get(base, async (c) => {
      const limit = c.req.query("limit");
      const cursor = c.req.query("cursor");
      const locale = c.req.query("locale");
      const services = c.get("services");

      const { items, nextCursor } = await services[slug].list({
        limit: limit ? Number(limit) : undefined,
        cursor,
        locale,
      });
      c.header("Cache-Control", "public, s-maxage=300, stale-while-revalidate=30");
      return c.json({ items, nextCursor: nextCursor ?? null });
    });

    app.get(`${base}/:${pk}`, async (c) => {
      const id = c.req.param(pk);
      const services = c.get("services");
      const item = await services[slug].getById(id);
      if (!item) return c.notFound();
      return c.json(item);
    });

    app.get(`${base}/slug/:slug`, async (c) => {
      const slug = c.req.param("slug");
      const services = c.get("services");
      const item = await services[slug].getBySlug(slug);
      if (!item) return c.notFound();
      return c.json(item);
    });


    app.post(base, async (c) => {
      const body = await c.req.json();
      const services = c.get("services");
      const created = await services[slug].create(body);
      return c.json(created, 201);
    });

    app.patch(`${base}/:${pk}`, async (c) => {
      const id = c.req.param(pk);
      const body = await c.req.json();
      const services = c.get("services");
      const updated = await services[slug].update(id, body);
      return c.json(updated);
    });

    app.delete(`${base}/:${pk}`, async (c) => {
      const id = c.req.param(pk);
      const services = c.get("services");
      await services[slug].remove(id);
      return c.json({ ok: true });
    });
  }
}