import { slugify } from "@/lib/utils";
import { OpacaCollection } from "@opaca/types/config";
import { Hono } from "hono";
import { Variables } from "@opaca/types/hono";


export type OpacaApiError = { code: string; message: string; details?: any };
export type OpacaApiResponse<T, M = Record<string, any> | null> = {
  success: boolean;
  data: T | null;
  error: OpacaApiError | null;
  meta: M;
  timestamp: string;
};

function ok<T, M = Record<string, any> | null>(
  c: any,
  data: T,
  meta?: M,
  status = 200
) {
  // Always return a consistent envelope
  return c.json(
    {
      success: true,
      data,
      error: null,
      meta: meta ?? null,
      timestamp: new Date().toISOString(),
    } as OpacaApiResponse<T, M>,
    status
  );
}

function fail(
  c: any,
  status: number,
  code: string,
  message: string,
  details?: any
) {
  return c.json(
    {
      success: false,
      data: null,
      error: { code, message, details },
      meta: null,
      timestamp: new Date().toISOString(),
    } as OpacaApiResponse<null>,
    status
  );
}

export function mountRest(app: Hono<{
  Variables: Variables
}>, cols: OpacaCollection[]) {

  for (const col of cols.filter((c) => c.rest)) {
    const collectionSlug = slugify(col.name); // avoid shadowing with route param names
    const base = `/${collectionSlug}`;
    const pk = "id";

    app.get(base, async (c) => {
      try {
        // Parse and validate query params
        const limitStr = c.req.query("limit");
        const cursor = c.req.query("cursor") ?? undefined;
        const locale = c.req.query("locale") ?? undefined;

        const limit = limitStr ? Number(limitStr) : undefined;
        if (limitStr && Number.isNaN(limit)) {
          return fail(c, 400, "INVALID_QUERY", "`limit` must be a number");
        }

        const services = c.get("services");
        const { items, nextCursor } = await services[collectionSlug].list({
          limit,
          cursor,
          locale,
        });

        // Cache only for list route (tune as needed)
        c.header(
          "Cache-Control",
          "public, s-maxage=300, stale-while-revalidate=30"
        );

        return ok(c, items, {
          nextCursor: nextCursor ?? null,
          limit: limit ?? null,
          locale: locale ?? null,
        });
      } catch (err: any) {
        return fail(
          c,
          500,
          "INTERNAL_ERROR",
          "Unexpected error fetching list",
          err?.message ?? err
        );
      }
    });

    app.get(`${base}/:${pk}`, async (c) => {
      try {
        const id = c.req.param(pk);
        const services = c.get("services");
        const item = await services[collectionSlug].getById(id);
        if (!item) {
          return fail(
            c,
            404,
            "NOT_FOUND",
            `Resource '${collectionSlug}' with ${pk}='${id}' not found`
          );
        }
        return ok(c, item);
      } catch (err: any) {
        return fail(
          c,
          500,
          "INTERNAL_ERROR",
          "Unexpected error fetching resource",
          err?.message ?? err
        );
      }
    });

    app.get(`${base}/slug/:slug`, async (c) => {
      try {
        // Avoid shadowing: param name differs from collectionSlug
        const itemSlug = c.req.param("slug");
        const services = c.get("services");
        const item = await services[collectionSlug].getBySlug(itemSlug);
        if (!item) {
          return fail(
            c,
            404,
            "NOT_FOUND",
            `Resource '${collectionSlug}' with slug='${itemSlug}' not found`
          );
        }
        return ok(c, item);
      } catch (err: any) {
        return fail(
          c,
          500,
          "INTERNAL_ERROR",
          "Unexpected error fetching resource by slug",
          err?.message ?? err
        );
      }
    });

    app.post(base, async (c) => {
      try {
        const body = await c.req.json().catch(() => null);
        if (!body || typeof body !== "object") {
          return fail(c, 400, "INVALID_BODY", "Body must be a JSON object");
        }
        const services = c.get("services");
        const created = await services[collectionSlug].create(body);
        return ok(c, created, null, 201);
      } catch (err: any) {
        return fail(
          c,
          500,
          "INTERNAL_ERROR",
          "Unexpected error creating resource",
          err?.message ?? err
        );
      }
    });

    app.patch(`${base}/:${pk}`, async (c) => {
      try {
        const id = c.req.param(pk);
        const body = await c.req.json().catch(() => null);
        if (!body || typeof body !== "object") {
          return fail(c, 400, "INVALID_BODY", "Body must be a JSON object");
        }
        const services = c.get("services");
        const updated = await services[collectionSlug].update(id, body);
        if (!updated) {
          return fail(
            c,
            404,
            "NOT_FOUND",
            `Resource '${collectionSlug}' with ${pk}='${id}' not found`
          );
        }
        return ok(c, updated);
      } catch (err: any) {
        return fail(
          c,
          500,
          "INTERNAL_ERROR",
          "Unexpected error updating resource",
          err?.message ?? err
        );
      }
    });

    app.delete(`${base}/:${pk}`, async (c) => {
      try {
        const id = c.req.param(pk);
        const services = c.get("services");
        const removed = await services[collectionSlug].remove(id);
        if (!removed) {
          return fail(
            c,
            404,
            "NOT_FOUND",
            `Resource '${collectionSlug}' with ${pk}='${id}' not found`
          );
        }
        // Return info about the deletion in meta for consistency
        return ok(c, { id }, { deleted: true });
      } catch (err: any) {
        return fail(
          c,
          500,
          "INTERNAL_ERROR",
          "Unexpected error deleting resource",
          err?.message ?? err
        );
      }
    });
  }
}