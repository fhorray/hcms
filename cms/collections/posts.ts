import { CollectionInput, FieldDefInput } from "../types";

export const Posts: CollectionInput = {
  name: "Posts", fields: {
    title: { type: "text", required: true, indexed: true },
    content: "text",
    published: { type: "boolean", default: false },
    author: {
      relation: { to: "users" }
    },         // FK authorId -> users.id
    tags: {
      relation: { to: "tags", many: true }
    }
  }
};