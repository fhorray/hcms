import { OpacaField } from "@opaca/types/config";
import { init } from "@paralleldrive/cuid2";

/*
  Apply common column modifiers based on OpacaField properties.
  Used by both PG and SQLite builders.
*/
export function applyCommonColumnModifiers<T>(col: T, f: OpacaField): T {
  let c: any = col;

  // Required -> notNull if available
  if ((f as any).required && typeof c.notNull === "function") c = c.notNull();

  // Unique if available
  if ((f as any).unique && typeof c.unique === "function") c = c.unique();

  // Default handling:
  // - "now": for date/timestamp columns, use defaultNow() if available
  // - primitives: use .default(value) if available
  const def = (f as any).default;
  if (def !== undefined) {
    if (def === "now" && typeof c.defaultNow === "function") {
      c = c.defaultNow();
    } else if (typeof c.default === "function") {
      c = c.default(def as any);
    }
  }

  // Optional manual PK (rare; generally we set id above)
  if ((f as any).primary === true && typeof c.primaryKey === "function") {
    c = c.primaryKey();
  }

  return c as T;
}


/**
 * Flatten nested containers to leaf fields that become columns.
 * Preserves provided columnName; adds automatic columnName if needed.
 */
export function flattenFields(fields: OpacaField[], prefix = ""): OpacaField[] {
  const out: OpacaField[] = [];

  for (const f of fields) {
    const t: any = (f as any).type;

    // Structural objects
    if (t && typeof t === "object") {
      // row: { row: [...] }
      if (Array.isArray(t.row)) {
        out.push(...flattenFields(t.row as OpacaField[], prefix));
        continue;
      }
      // group-like: { fields: [...] }
      if (Array.isArray(t.fields)) {
        out.push(...flattenFields(t.fields as OpacaField[], prefix));
        continue;
      }
      // tabs: [{ name, fields: [...] }, ...]
      if (Array.isArray(t.tabs)) {
        for (const tab of t.tabs) {
          if (Array.isArray((tab as any)?.fields)) {
            out.push(...flattenFields((tab as any).fields as OpacaField[], prefix));
          }
        }
        continue;
      }
      // blocks: [{ slug, fields: [...] }, ...]
      if (Array.isArray(t.blocks)) {
        for (const block of t.blocks) {
          if (Array.isArray((block as any)?.fields)) {
            out.push(...flattenFields((block as any).fields as OpacaField[], prefix));
          }
        }
        continue;
      }
    }

    // Leaf field: ensure columnName if a prefix is required (we keep it simple)
    if (prefix) {
      out.push({
        ...(f as any),
        columnName: (f as any).columnName ?? `${prefix}${(f as any).name}`,
      });
    } else {
      out.push(f);
    }
  }

  return out;
}

/**
 * Inspect the first option to decide if it is number or string.
 * Fallback to string.
 */
export function peekOptionValueType(
  options: { label: string; value: string | number }[] | undefined
): "string" | "number" {
  if (!options?.length) return "string";
  return typeof options[0].value === "number" ? "number" : "string";
}

/*
Create CUID2 id
*/
export function createId(length?: number): string {
  return init({ length: length ?? 20 })();
}