import { Table } from "drizzle-orm";

/** Universal DB surface to avoid union overload issues. */
export type UniversalDb = {
  select: () => any;
  insert: (tbl: Table) => any;
  update: (tbl: Table) => any;
  delete: (tbl: Table) => any;
};