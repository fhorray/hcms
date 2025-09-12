import { OpacaCollection } from "@opaca/types/config";

export const Properties: OpacaCollection = {
  name: "Properties",
  fields: [
    { name: "title", type: "text", required: true },
    { name: "description", type: "text" },
    { name: "price", type: "number", required: true },
    { name: "available", type: "switcher", default: true },
  ],
};