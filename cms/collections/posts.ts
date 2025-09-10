import { OpacaCollection, OpacaField } from "../types";

export const Posts: OpacaCollection = {
  name: "Post",
  fields: {
    title: { type: "text", required: true, indexed: true },
    body: "rich-text",
    published: { type: "checkbox", default: false, indexed: true },
    createdAt: { type: "date", default: "now" },
    authorId: { type: { relationship: { to: "posts" } }, indexed: true },
    tags: "array",
    kind: { type: { enum: ["draft", "post", "note"] }, default: "draft" },
  },
}