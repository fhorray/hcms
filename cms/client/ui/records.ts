import {
  Type as StringIcon,
  Hash as NumberIcon,
  ToggleLeft as BooleanIcon,
  Calendar as DateIcon,
  List as EnumIcon,
  Braces as JsonIcon,
  File as BlobIcon,
  HelpCircle as UnknownIcon,
  LucideIcon,
} from "lucide-react";

import { FieldKind } from "@/cms/builders";

// Record de ícones por tipo
export const GetFielfKindIconRecord: Record<FieldKind, LucideIcon> = {
  string: StringIcon,
  number: NumberIcon,
  boolean: BooleanIcon,
  date: DateIcon,
  enum: EnumIcon,
  json: JsonIcon,
  blob: BlobIcon,
  unknown: UnknownIcon,
};
