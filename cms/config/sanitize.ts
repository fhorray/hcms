// Comments in English only.

import { slugify } from "@/lib/utils";
import type { OpacaConfig, OpacaCollection, BuiltOpacaConfig } from "../types";

export function sanitize(rawConfig: OpacaConfig): BuiltOpacaConfig {
  // 1) Enforce array input
  if (!Array.isArray(rawConfig.collections)) {
    throw new Error("`collections` must be an array of OpacaCollection.");
  }

  // 2) Normalize and validate each collection
  const list = rawConfig.collections.map((raw, idx) => {
    const name = (raw?.name ?? "").toString().trim();
    if (!name) {
      throw new Error(`Collection[${idx}] is missing 'name'.`);
    }

    const computedSlug = (raw.slug ?? slugify(name)).toString().trim();
    if (!computedSlug) {
      throw new Error(`Collection[${idx}] produced an empty 'slug'.`);
    }

    // Optional stricter validation for slugs. Adjust if your rules differ.
    const isValidSlug = /^[a-z0-9]([a-z0-9-_]*[a-z0-9])?$/.test(computedSlug);
    if (!isValidSlug) {
      throw new Error(
        `Invalid slug '${computedSlug}' at Collection[${idx}]. Use lowercase letters, numbers, '-' or '_' (cannot start/end with separators).`
      );
    }

    const fields =
      raw && typeof raw === "object" && "fields" in raw && raw.fields
        ? (raw.fields as Record<string, unknown>)
        : {};

    return {
      ...raw,
      name,
      slug: computedSlug,
      primaryKey: raw.primaryKey ?? "id",
      fields,
    } as OpacaCollection & { slug: string };
  });

  // 3) Check duplicates and build order index
  const seen = new Set<string>();
  const bySlug: Record<string, number> = {};
  const order: string[] = [];

  for (let i = 0; i < list.length; i++) {
    const s = list[i].slug;
    if (seen.has(s)) {
      throw new Error(`Duplicate collection slug: '${s}'.`);
    }
    seen.add(s);
    bySlug[s] = i;
    order.push(s);
  }

  // 4) Build the Record keyed by slug
  const asRecord: Record<string, OpacaCollection> = {};
  for (const c of list) {
    asRecord[c.slug] = c;
  }

  // 5) Compose final built config
  const built: BuiltOpacaConfig = {
    ...rawConfig,
    collections: asRecord,
    _index: { bySlug, order },
  };

  return deepFreeze(built);
}

// Deep freeze for immutability guarantees at runtime
function deepFreeze<T>(obj: T): T {
  if (obj && typeof obj === "object") {
    Object.freeze(obj);
    for (const key of Object.keys(obj as any)) {
      // @ts-ignore - walk recursively
      deepFreeze((obj as any)[key]);
    }
  }
  return obj;
}

export type { BuiltOpacaConfig };
