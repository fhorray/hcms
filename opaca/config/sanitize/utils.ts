import { pluralize, slugify } from "@/lib/utils";
import { LucideIconName, OpacaField, OpacaPrimitiveFieldType, OpacaRelatioshipFieldType, OpacaRowField, OpacaSelectFieldType } from "@/opaca/types/config";

type AllFields = OpacaPrimitiveFieldType | OpacaRelatioshipFieldType | OpacaRowField | OpacaSelectFieldType;

export function isObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object";
}

export function isRowType(
  t: AllFields
): t is OpacaRowField {
  return isObject(t) && "row" in t;
}

export function isRelationshipType(
  t: AllFields
): t is OpacaRelatioshipFieldType {
  return isObject(t) && "relationship" in t;
}

export function isSelectType(t: AllFields): boolean {
  return isObject(t) && "select" in t;
}


// Column name convention: <collectionSlug>__<fieldSlug>
export function toColumnName(collectionSlug: string, fieldName: string): string {
  const fieldSlug = slugify(fieldName).replace(/-/g, "_");
  const colSlug = collectionSlug.replace(/-/g, "_");
  return `${colSlug}__${fieldSlug}`;
}

export function assertNever(x: never): never {
  throw new Error(`Unexpected case: ${x}`);
}

export const DEFAULT_ICON: LucideIconName = "Folder";