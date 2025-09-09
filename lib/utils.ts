import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { init } from "@paralleldrive/cuid2"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const slugify = (s: string) =>
  s.trim().toLowerCase()
    .replace(/[\s\-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/^_+|_+$/g, '');

export const humanize = (s: string) =>
  s.trim().replace(/([a-z])([A-Z])/g, "$1 $2")
