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
    { name: "Tags", fields: { label: { enum: ["tech", "news", "sports", "others"], required: true, indexed: true } } },

    // JSON Schema Example
    {
      name: "Products",
      icon: ShoppingCartIcon,
      fields: {
        title: { type: "textarea", required: true, indexed: true },
        price: { type: "number", required: true, indexed: true },
        inStock: { type: "switcher", default: true, indexed: true },
        tags: { type: "json" },
        description: { type: "rich-text" },
        releaseDate: { type: "date" },
        // user: { relationship: { to: "users" }, required: true, indexed: true },
        // category: { relationship: { to: "" }, required: true, indexed: true },
      }
    }
  ],
} satisfies ProjectInput;
