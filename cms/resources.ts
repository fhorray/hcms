import type { ProjectSchema } from "./dsl";

export default {
  resources: [
    {
      name: "Users",
      slug: "users",
      primaryKey: "id",
      fields: {
        id: { type: "int", required: true, unique: true },
        email: { type: "text", required: true, unique: true, indexed: true },
        name: { type: "text" }
      }
    },
    {
      name: "Tags",
      slug: "tags",
      primaryKey: "id",
      fields: {
        id: { type: "int", required: true, unique: true },
        label: { type: { enum: ["tech", "news", "sports"] }, required: true, indexed: true }
      }
    },
    {
      name: "Posts",
      slug: "posts",
      primaryKey: "id",
      fields: {
        id: { type: "int", required: true, unique: true },
        title: { type: "text", required: true, indexed: true },
        content: { type: "text" },
        published: { type: "boolean", default: false },
        authorId: {
          type: "int",
          required: true,
          references: { table: "users", field: "id" },
          indexed: true
        },
        // many-to-many com tags -> geraremos a join table posts_tags
        tags: { type: { relation: { to: "tags", kind: "many-to-many" } } }
      }
    }
  ]
} satisfies ProjectSchema;
