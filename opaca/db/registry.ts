import type { OpacaDbAdapter } from "./types";

export type AdapterSpec =
  | { kind: "pg"; options: Record<string, any> }
  | { kind: "sqlite"; options: Record<string, any> }
  | { kind: "d1"; options: Record<string, any> };

export async function loadAdapter(spec: AdapterSpec): Promise<OpacaDbAdapter> {
  switch (spec.kind) {
    // case "pg": {
    //   const { createPgAdapter } = await import("@/opaca/db/adapters/pg");
    //   return createPgAdapter(spec.options);
    // }
    // case "sqlite": {
    //   const { createSqliteAdapter } = await import("@/opaca/db/adapters/sqlite");
    //   return createSqliteAdapter(spec.options);
    // }
    case "d1": {
      const { D1Adapter } = await import("@/opaca/db/adapters/d1");
      return D1Adapter(spec.options);
    }
    default:
      throw new Error(`Unknown adapter: ${(spec as any)?.kind}`);
  }
}