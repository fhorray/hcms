import { OpacaCollection } from "@opaca/types/config";

export const Posts: OpacaCollection = {
  name: "Posts",
  rest: true,
  fields: [
    { name: "title", type: "text", required: true, indexed: true },
    { name: "body", type: "rich-text" },
    { name: "published", type: "checkbox", default: false, indexed: true },
    // { name: "authorId", type: { relationship: { to: "users" } }, indexed: true },
    { name: "tags", type: "array" },
  ],
};