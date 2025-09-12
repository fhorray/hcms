// services/makeRepo.ts
import { and, asc, desc, eq, gt, lt } from "drizzle-orm";
import type { DrizzleLikeDatabase } from "@opaca/db/types";
import { RepoOptions } from "./types";
import { dec, enc } from "./helpers";
import { slugify } from "@/lib/utils";


/**
 * Builds a simple CRUD repo on top of Drizzle. 
 * `schema` is the module the  DB adapter dynamically loads.
 */
export function makeRepo(db: DrizzleLikeDatabase, schema: any, opts: RepoOptions) {
  const table = schema[slugify(opts.tableName)];
  if (!table) {
    const keys = Object.keys(schema).filter(k => typeof (schema as any)[k] === "object");
    throw new Error(`Table "${opts.tableName}" not found in schema. Available: ${keys.join(", ")}`);
  }

  const pkCol = table[opts.pk];
  if (!pkCol) throw new Error(`PK "${opts.pk}" not found on table "${opts.tableName}".`);

  const orderColName = opts.orderBy?.column ?? opts.pk;
  const orderCol = table[orderColName];
  const orderDir = (opts.orderBy?.direction ?? "desc") as "asc" | "desc";
  if (!orderCol) throw new Error(`Order column "${orderColName}" not found on "${opts.tableName}".`);

  const slugCol = opts.slug ? table[opts.slug] : null;

  type CursorShape = { o?: any; k?: any }; // order value + pk

  return {
    async list(args: { limit?: number; cursor?: string | null; locale?: string | null }) {
      const limit = Math.min(Math.max(Number(args.limit ?? 20), 1), 100);
      const cur = dec<CursorShape>(args.cursor);
      const isAsc = orderDir === "asc";

      // Note: D1/SQLite lacks tuple compare; we keep the predicate simple and rely on ordering + slice.
      let where: any = undefined;
      if (cur && cur.o !== undefined) {
        where = isAsc ? gt(orderCol, cur.o) : lt(orderCol, cur.o);
      }

      const orderFn = isAsc ? asc : desc;

      // Fetch limit+1 to detect next page; tie-break with PK for stable order
      // @ts-ignore drizzle d1 typing is permissive here
      let q = db.select().from(table);
      if (where) q = q.where(where);
      // @ts-ignore
      q = q.orderBy(orderFn(orderCol), orderFn(pkCol)).limit(limit + 1);

      const rows = await q;
      const slice = rows.slice(0, limit);
      const hasMore = rows.length > limit;
      const last = slice.at(-1);

      const nextCursor =
        hasMore && last ? enc({ o: last[orderColName], k: last[opts.pk] }) : undefined;

      return { items: slice, nextCursor };
    },

    async getById(id: string) {
      // @ts-ignore
      const rows = await db.select().from(table).where(eq(pkCol, id)).limit(1);
      return rows[0] ?? null;
    },

    async getBySlug(slug: string) {
      if (!slugCol) return null;
      // @ts-ignore
      const rows = await db.select().from(table).where(eq(slugCol, slug)).limit(1);
      return rows[0] ?? null;
    },

    async create(data: any) {
      // @ts-ignore
      const res = await db.insert(table).values(data);
      return Array.isArray(res) ? res[0] : data;
    },

    async update(id: string, patch: any) {
      // @ts-ignore
      const res = await db.update(table).set(patch).where(eq(pkCol, id));
      return Array.isArray(res) ? res[0] : { ...patch, [opts.pk]: id };
    },

    async remove(id: string) {
      // @ts-ignore
      await db.delete(table).where(eq(pkCol, id));
      return { ok: true as const };
    },
  };
}
