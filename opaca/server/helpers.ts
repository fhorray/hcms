import type { Table } from "drizzle-orm";

/** Guard to detect a Drizzle table object (SQLite, D1, PG). */
export function isDrizzleTable(x: unknown): x is Table {
  if (!x || typeof x !== "object") return false;
  const obj = x as Record<string, unknown>;

  // Drizzle brands table objects with a symbol like Symbol(drizzle:IsDrizzleTable)
  const hasBrand = Object.getOwnPropertySymbols(obj).some(
    (s) => (s as any).description === "drizzle:IsDrizzleTable"
  );

  // Most table objects also expose a `columns` bag.
  const hasColumns = Object.prototype.hasOwnProperty.call(obj, "columns");

  // Do NOT require `schema`, because PG tables may not have a plain `schema` key.
  return hasBrand && hasColumns;
}

/** Small helper to resolve result across drivers (pg/sqlite/d1). */
export async function resolveResult<T = any>(q: any): Promise<T> {
  if (q && typeof q.execute === "function") return await q.execute();
  if (q && typeof q.all === "function") return await q.all();
  return await q;
}
/** Parse id: number if looks numeric, else string. */
export function parseId(raw: string) {
  return /^\d+$/.test(raw) ? Number(raw) : raw;
}