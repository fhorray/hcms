import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { init } from "@paralleldrive/cuid2"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const slugify = (s: string) =>
  s.normalize("NFKC")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\p{Letter}\p{Number}-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

