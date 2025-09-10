import { OpacaCollection } from "@/cms/types";

export const Properties: OpacaCollection = {
  name: "Properties",
  slug: "properties",
  fields: {
    title: { type: "text", required: true },
    description: { type: "text" },
    price: { type: "number", required: true },
    available: { type: "switcher", default: true },
  }
}