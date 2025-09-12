import { BuiltField, OpacaBuiltConfig, BuiltRelation, LucideIconName, OpacaBaseField, OpacaCollection, OpacaConfig, OpacaField, OpacaRelatioshipFieldType, OpacaSelectFieldType } from "@/opaca/types/config";
import { DEFAULT_ICON, isObject, isRelationshipType, isRowType, isSelectType, toColumnName } from "./utils";
import { slugify } from "@/lib/utils";

export function sanitize(rawConfig: OpacaConfig): OpacaBuiltConfig {
  // 1) Guard collections
  if (!isObject(rawConfig) || !Array.isArray(rawConfig.collections)) {
    throw new Error("`collections` must be an array of OpacaCollection.");
  }

  // 2) Normalize collections (slug, icon) and basic validation
  const normalizedList: Array<OpacaCollection & { slug: string; icon: string }> =
    rawConfig.collections.map((raw, idx) => {
      const name = (raw?.name ?? "").toString().trim();
      if (!name) {
        throw new Error(`Collection[${idx}] is missing 'name'.`);
      }

      const slug = slugify(name).toString().trim();
      if (!slug) {
        throw new Error(`Collection[${idx}] produced an empty 'slug'.`);
      }
      // conservative slug guardrail
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        throw new Error(
          `Collection[${idx}] slug '${slug}' is invalid. Use lowercase letters, digits, and single hyphens.`
        );
      }

      const icon = (raw.icon ?? DEFAULT_ICON) as LucideIconName;

      // basic fields validation
      if (!Array.isArray(raw.fields) || raw.fields.length === 0) {
        throw new Error(`Collection '${name}' must declare at least one field.`);
      }

      return {
        ...raw,
        slug,
        icon,
      };
    });

  // 3) Detect duplicate slugs and names
  const seenSlugs = new Set<string>();
  const seenNames = new Set<string>();
  for (const col of normalizedList) {
    if (seenSlugs.has(col.slug)) {
      throw new Error(`Duplicate collection slug '${col.slug}'.`);
    }
    seenSlugs.add(col.slug);

    const nameKey = col.name.toLowerCase();
    if (seenNames.has(nameKey)) {
      throw new Error(`Duplicate collection name '${col.name}'.`);
    }
    seenNames.add(nameKey);
  }

  // 4) Build indexes
  const order = normalizedList.map((c) => c.slug);
  const bySlug: Record<string, number> = {};
  const byName: Record<string, string> = {};
  normalizedList.forEach((c, i) => {
    bySlug[c.slug] = i;
    byName[c.name] = c.slug;
  });

  // 5) Flatten fields and compute BuiltField metadata
  const fieldsByCollection: Record<string, BuiltField[]> = {};
  const fieldByPath: Record<`${string}.${string}`, BuiltField> = {};

  // for selects
  const selectsOptionsByPath: Record<
    `${string}.${string}`,
    { label: string; value: string | number }[]
  > = {};
  const selectsRelationshipByPath: Record<
    `${string}.${string}`,
    OpacaSelectFieldType["select"]["relationship"] | undefined
  > = {};

  // relationships registry
  const relationships: BuiltRelation[] = [];
  const relsByTarget: Record<string, BuiltRelation[]> = {};

  // Build a schema map of all collection slugs for validation
  const schema: Record<string, boolean> = {};
  for (const col of normalizedList) {
    schema[col.slug] = true;
  }

  for (const col of normalizedList) {
    const flat = flattenFields(col.fields);
    const builtFields: BuiltField[] = [];

    // track duplicate field names within a collection after flatten
    const seenFieldNames = new Set<string>();

    for (const f of flat) {
      // base fields must have "name"
      if (!("name" in f) || !f.name) {
        throw new Error(
          `Collection '${col.name}' has a field without a 'name' after flatten.`
        );
      }
      const fname = String(f.name).trim();
      if (!fname) {
        throw new Error(
          `Collection '${col.name}' has an empty field name after flatten.`
        );
      }
      if (seenFieldNames.has(fname)) {
        throw new Error(
          `Collection '${col.name}' has duplicate field name '${fname}'.`
        );
      }
      seenFieldNames.add(fname);

      // ensure type is not a row (flatten already handled)
      const ftype = (f as OpacaBaseField).type;
      if (isRowType(ftype)) {
        throw new Error(
          `Collection '${col.name}' field '${fname}' is still a 'row' after flatten.`
        );
      }

      const path = `${col.slug}.${fname}` as const;
      const columnName =
        (f as OpacaBaseField).columnName ?? toColumnName(col.slug, fname);

      const built: BuiltField = {
        // preserve OpacaBaseField shape (minus 'type' override below)
        name: fname,
        required: (f as OpacaBaseField).required,
        default: (f as OpacaBaseField).default,
        unique: (f as OpacaBaseField).unique,
        indexed: (f as OpacaBaseField).indexed,
        references: (f as OpacaBaseField).references,
        hidden: (f as OpacaBaseField).hidden,
        layout: (f as OpacaBaseField).layout,

        // built-only
        type: ftype,
        path,
        columnName,
      };

      // 5.a) Handle relationship fields
      if (isRelationshipType(ftype)) {
        const rel = (ftype as OpacaRelatioshipFieldType).relationship;
        // Validate target exists in schema (compile-time keyof typeof schema + runtime check)
        if (!(rel.to in schema)) {
          throw new Error(
            `Field '${path}' references unknown schema table '${String(rel.to)}'.`
          );
        }
        built.isRelation = true;
        built.relation = rel;

        const item: BuiltRelation = {
          from: { collection: col.slug, field: fname, path },
          to: {
            collection: rel.to,
            via: rel.through,
            many: rel.many,
          },
          kind: "relationship",
        };
        relationships.push(item);
        const t = String(rel.to);
        relsByTarget[t] = relsByTarget[t] || [];
        relsByTarget[t].push(item);
      }

      // 5.b) Handle select fields (options + optional relationship)
      if (isSelectType(ftype)) {
        const { options = [], relationship } = (ftype as OpacaSelectFieldType).select;
        if (options && options.length) {
          selectsOptionsByPath[path] = options;
          built.selectOptions = options;
        } else {
          built.selectOptions = null;
        }

        if (relationship) {
          // Validate target exists
          if (!(relationship.to in schema)) {
            throw new Error(
              `Select field '${path}' references unknown schema table '${String(
                relationship.to
              )}'.`
            );
          }
          selectsRelationshipByPath[path] = relationship;
          built.isRelation = true;
          built.relation = relationship;

          const item: BuiltRelation = {
            from: { collection: col.slug, field: fname, path },
            to: { collection: relationship.to, many: undefined, via: undefined },
            kind: "select.relationship",
          };
          relationships.push(item);
          const t = String(relationship.to);
          relsByTarget[t] = relsByTarget[t] || [];
          relsByTarget[t].push(item);
        }
      }

      builtFields.push(built);
      fieldByPath[path] = built;
    }

    fieldsByCollection[col.slug] = builtFields;
  }

  // 6) Assemble OpacaBuiltConfig
  const collectionsMap: OpacaBuiltConfig["collections"] = {};
  for (const c of normalizedList) {
    collectionsMap[c.slug] = c;
  }

  const built: OpacaBuiltConfig = {
    // original (passthrough)
    database: rawConfig.database as OpacaConfig["database"],
    admin: rawConfig.admin,
    auth: rawConfig.auth,

    // normalized collections by slug
    collections: collectionsMap,

    // indexes
    _index: {
      bySlug,
      byName,
      order,
    },

    // fields and lookups
    _fields: {
      byCollection: fieldsByCollection,
      byPath: fieldByPath,
    },

    // relationships
    _relationships: {
      list: relationships,
      byTarget: relsByTarget,
    },

    // selects
    _selects: {
      optionsByPath: selectsOptionsByPath,
      relationshipByPath: selectsRelationshipByPath,
    },
  };

  return built;
}



// --------------------- Flatten logic ---------------------

/**
 * Flattens an array of OpacaField:
 * - Expands `row` containers, preserving inner fields (recursively).
 * - Returns only concrete fields (those requiring `name`).
 */
function flattenFields(fields: OpacaField[]): OpacaBaseField[] {
  const out: OpacaBaseField[] = [];

  for (const f of fields) {
    // Row container
    if (isRowType((f as any).type)) {
      const row = (f as any).type.row as OpacaField[];
      if (!Array.isArray(row) || row.length === 0) continue;
      out.push(...flattenFields(row));
      continue;
    }

    // Concrete field (must have name)
    const bf = f as OpacaBaseField;
    if (!bf.name) {
      throw new Error(
        "Found a non-row field without 'name' after flattening."
      );
    }
    out.push(bf);
  }

  return out;
}