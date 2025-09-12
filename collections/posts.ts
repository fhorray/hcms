import { OpacaCollection } from "@opaca/types/config";

export const Posts: OpacaCollection = {
  name: "Posts",
  slug: "posts",
  fields: [
    { name: "title", type: "text", required: true, indexed: true },
    { name: "body", type: "rich-text" },
    { name: "published", type: "checkbox", default: false, indexed: true },
    { name: "createdAt", type: "date", default: "now" },
    // { name: "authorId", type: { relationship: { to: "users" } }, indexed: true },
    { name: "tags", type: "array" },
  ],
};