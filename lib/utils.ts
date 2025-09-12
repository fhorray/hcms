import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type Separator = "-" | "_";

export function slugify(
  input: string,
  opts?: { separator?: Separator }
): string {
  const sep: Separator = opts?.separator ?? "-";
  const escapedSep = sep === "-" ? "\\-" : "_"; // escape for RegExp

  return input
    .normalize("NFKC")
    .trim()
    // 1) Insert separator at camelCase / PascalCase boundaries
    //    e.g., "XMLHttp" -> "XML-Http", "emailVerified" -> "email-Verified"
    .replace(/([A-Z]+)([A-Z][a-z])/g, `$1${sep}$2`)
    .replace(/([a-z0-9])([A-Z])/g, `$1${sep}$2`)
    // 2) Normalize whitespace and existing separators to the chosen one
    .replace(/[\s\-_]+/g, sep)
    // 3) Lowercase after splitting by case boundaries
    .toLowerCase()
    // 4) Keep only letters, numbers, and the chosen separator
    .replace(new RegExp(`[^\\p{Letter}\\p{Number}${escapedSep}]`, "gu"), "")
    // 5) Collapse duplicate separators
    .replace(new RegExp(`${escapedSep}+`, "g"), sep)
    // 6) Trim leading/trailing separators
    .replace(new RegExp(`^${escapedSep}|${escapedSep}$`, "g"), "");
}

export const captalize = (s: string) => {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function pluralize(s: string): string {
  if (!s) return s;

  // Already plural (simple heuristic)
  if (s.endsWith("s") && !s.endsWith("ss")) {
    return s; // e.g., "products" stays "products"
  }

  // Words ending in "y" preceded by consonant → "ies"
  if (s.endsWith("y") && !/[aeiou]y$/i.test(s)) {
    return s.slice(0, -1) + "ies"; // Category -> Categories
  }

  // Words ending in sibilant sounds → add "es"
  if (/(s|x|z|ch|sh)$/.test(s)) {
    return s + "es"; // Box -> Boxes, Match -> Matches
  }

  // Default case → add "s"
  return s + "s"; // Post -> Posts
}

export const pascalize = (s: string) => {
  return s
    .replace(/(^\w|[-_]\w)/g, (m) => m.replace(/[-_]/, "").toUpperCase());
}