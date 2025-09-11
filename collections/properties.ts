import { OpacaCollection } from "@/cms/types";

export const Properties: OpacaCollection = {
  name: "Properties",
  slug: "properties",
  fields: [
    { name: "title", type: "text", required: true },
    { name: "description", type: "text" },
    { name: "price", type: "number", required: true },
    { name: "available", type: "switcher", default: true },
  ],
};
