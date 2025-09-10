import { OpacaCollection } from "@/cms/types";
import { ShoppingCartIcon } from "lucide-react";

export const Products: OpacaCollection = {
  name: "Products",
  slug: "products",
  icon: "ShoppingCartIcon",
  fields: {
    title: { type: "textarea", required: true, indexed: true },
    price: { type: "number", required: true, indexed: true },
    inStock: { type: "switcher", default: true, indexed: true },
    tags: { type: "json" },
    description: { type: "rich-text" },
    releaseDate: { type: "date" },

  }
}