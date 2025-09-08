import { ShoppingCart, ShoppingCartIcon, UserIcon } from "lucide-react";
import { ProjectInput } from "../types";
import { Posts } from "./posts";

export default {
  collections: [
    // Posts,
    {
      name: "Users",
      icon: UserIcon,
      fields: {
        email:
        {
          type: "text",
          required: true,
          unique: true,
          indexed: true
        },
        name: {
          type: "text",
        }
      }
    },
    { name: "Tags", fields: { label: { enum: ["tech", "news", "sports"], required: true, indexed: true } } },

    // JSON Schema Example
    {
      name: "Products",
      icon: ShoppingCartIcon,
      fields: {
        title: { type: "text", required: true, indexed: true },
        price: { type: "float", required: true, indexed: true },
        inStock: { type: "boolean", default: true, indexed: true },
        tags: { type: "json" },
        description: { type: "richtext" },
        releaseDate: { type: "date" },
        // category: { relation: { to: "users" }, required: true, indexed: true },
      }
    }
  ],
} satisfies ProjectInput;
