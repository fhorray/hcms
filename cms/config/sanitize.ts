// Comments in English only.

import { slugify } from "@/lib/utils";
import type {
  OpacaConfig,
  OpacaCollection,
  BuiltOpacaConfig,
  OpacaField,
} from "../types";

export function sanitize(rawConfig: OpacaConfig): BuiltOpacaConfig {
  // 1) Input contract
  if (!Array.isArray(rawConfig.collections)) {
    throw new Error("`collections` must be an array of OpacaCollection.");
  }

  // 2) Normalize collections
  const list: Array<OpacaCollection & { slug: string; icon: string }> =
    rawConfig.collections.map((raw, idx) => {
      // Name
      const name = String(raw?.name ?? "").trim();
      if (!name) throw new Error(`Collection[${idx}] is missing 'name'.`);

      // Slug (deterministic, no pluralization)
      const computedSlug = String(raw.slug ?? slugify(name)).trim();
      if (!computedSlug) {
        throw new Error(`Collection[${idx}] produced an empty 'slug'.`);
      }
      const isValidSlug = /^[a-z0-9](?:[a-z0-9-_]*[a-z0-9])?$/.test(computedSlug);
      if (!isValidSlug) {
        throw new Error(
          `Invalid slug '${computedSlug}' at Collection[${idx}]. ` +
          "Use lowercase letters, numbers, '-' or '_' (cannot start/end with separators)."
        );
      }

      // Fields
      const fieldsInput = Array.isArray(raw.fields) ? raw.fields : [];
      const fields = sanitizeFields(fieldsInput, `Collection[${idx}]`);

      // Icon fallback: normalize to string
      const icon = String(raw.icon ?? "Database");

      return {
        ...raw,
        name,
        slug: computedSlug,
        fields,
        icon,
      } as OpacaCollection & { slug: string; icon: string };
    });

  // 3) Duplicate slug check & index
  const seen = new Set<string>();
  const bySlug: Record<string, number> = {};
  const order: string[] = [];
  list.forEach((c, i) => {
    if (seen.has(c.slug)) throw new Error(`Duplicate collection slug: '${c.slug}'.`);
    seen.add(c.slug);
    bySlug[c.slug] = i;
    order.push(c.slug);
  });

  // 4) Record keyed by slug
  const asRecord: Record<string, OpacaCollection & { slug: string; icon: string }> = {};
  for (const c of list) asRecord[c.slug] = c;

  // 5) Compose built config
  const built: BuiltOpacaConfig = {
    ...(rawConfig as Omit<OpacaConfig, "collections">),
    collections: asRecord,
    _index: { bySlug, order },
  };

  return deepFreeze(built);
}

/**
 * Sanitize and validate OpacaField[].
 * - Accepts both official `type: { row: [...] }` and loose `{ row: [...] }` and normalizes to the official shape.
 * - Row containers do NOT require `name`; base fields DO require `name`.
 * - Enforces sibling name uniqueness (ignores unnamed row containers).
 */
function sanitizeFields(input: any[], ctx: string): OpacaField[] {
  if (!Array.isArray(input)) {
    throw new Error(`${ctx}.fields must be an array of OpacaField.`);
  }

  const out: OpacaField[] = [];
  const siblingNames = new Set<string>();

  for (let i = 0; i < input.length; i++) {
    const raw = input[i];
    if (!raw || typeof raw !== "object") {
      throw new Error(`${ctx}.fields[${i}] must be an object.`);
    }

    // Shallow clone to avoid mutating caller objects
    let field: any = { ...raw };

    // Normalize loose top-level `row: []` into official `type: { row: [] }`
    if (Array.isArray(field.row) && !field.type) {
      field = { ...field, type: { row: field.row } };
      delete field.row;
    }

    // Ensure type exists
    const t = field.type;
    if (!t) throw new Error(`${ctx}.fields[${i}] is missing 'type'.`);

    // Detect row container
    const isRow =
      typeof t === "object" && t !== null && Array.isArray((t as any).row);

    // Validate name rules
    const rawName = String(field.name ?? "").trim();
    if (!isRow) {
      // Base fields require name
      if (!rawName) {
        throw new Error(`${ctx}.fields[${i}] is missing 'name'.`);
      }
      if (siblingNames.has(rawName)) {
        throw new Error(`${ctx}.fields has duplicate field name '${rawName}'.`);
      }
      siblingNames.add(rawName);
    } else {
      // Row container: name is optional, but if provided, must be unique
      if (rawName) {
        if (siblingNames.has(rawName)) {
          throw new Error(`${ctx}.fields has duplicate field name '${rawName}'.`);
        }
        siblingNames.add(rawName);
      }

      // Validate children
      const children = (t as any).row;
      if (!Array.isArray(children)) {
        throw new Error(`${ctx}.fields[${i}].type.row must be an array of OpacaField.`);
      }

      const label = rawName || `row#${i}`;
      const sanitizedChildren = sanitizeFields(children, `${ctx}.fields[${i}](${label})`);

      // Rebuild `type` to ensure normalized children
      field = {
        ...field,
        type: { ...(t as any), row: sanitizedChildren },
      };
    }

    out.push(field as OpacaField);
  }

  return out;
}

// Deep freeze for immutability guarantees at runtime
function deepFreeze<T>(obj: T): T {
  if (obj && typeof obj === "object") {
    Object.freeze(obj);
    for (const key of Object.keys(obj as any)) {
      // @ts-ignore - recursive walk
      deepFreeze((obj as any)[key]);
    }
  }
  return obj;
}
