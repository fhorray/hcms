import { OpacaCollection } from "@opaca/types/config";

export const Products: OpacaCollection = {
  name: "Products",
  slug: "products",
  icon: "ShoppingCartIcon",
  fields: [
    { name: "title", type: "textarea", required: true, indexed: true },
    { name: "price", type: "number", required: true, indexed: true },
    { name: "inStock", type: "switcher", default: true, indexed: true },
    { name: "tags", type: "json" },
    { name: "description", type: "rich-text" },
    { name: "releaseDate", type: "date" },
  ],
};