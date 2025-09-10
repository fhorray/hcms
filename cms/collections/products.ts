import { ShoppingCartIcon } from "lucide-react";
import { OpacaCollection } from "../types";

export const Products: OpacaCollection = {
  name: "Products",
  icon: ShoppingCartIcon,
  fields: {
    title: { type: "textarea", required: true, indexed: true },
    price: { type: "number", required: true, indexed: true },
    inStock: { type: "switcher", default: true, indexed: true },
    tags: { type: "json" },
    description: { type: "rich-text" },
    releaseDate: { type: "date" },
    user: { relationship: { to: "users" }, required: true, indexed: true },
  }
}