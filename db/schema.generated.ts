// AUTO-GERADO por codegen.ts — NÃO EDITAR
import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
    id: integer("id").notNull().unique().primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name"),
  },
  (t) => ({
    idx_users_email: index("users_email_idx").on(t.email)
  }));

export const tags = sqliteTable("tags", {
    id: integer("id").notNull().unique().primaryKey({ autoIncrement: true }),
  label: text("label").notNull(),
  },
  (t) => ({
    idx_tags_label: index("tags_label_idx").on(t.label)
  }));

export const posts = sqliteTable("posts", {
    id: integer("id").notNull().unique().primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content"),
  published: integer("published").default(0),
  authorId: integer("authorId").notNull().references(() => users.id),
  },
  (t) => ({
    idx_posts_title: index("posts_title_idx").on(t.title),
  idx_posts_authorId: index("posts_authorId_idx").on(t.authorId)
  }));

export const posts_tags = sqliteTable("posts_tags", {
  posts_id: integer("posts_id").notNull(),
  tags_id: integer("tags_id").notNull()
}); // TODO: criar unique index composto (posts_id, tags_id) via migration
