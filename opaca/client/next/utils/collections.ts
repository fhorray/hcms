import { LucideIconName } from '@opaca/types/config';
import * as Lucide from 'lucide-react';

export function getIconByPascal(name?: LucideIconName) {
  const Icon = name ? (Lucide as any)[name] : undefined;
  return Icon ?? Lucide.DatabaseIcon; // fallback
}