// AUTO-GERADO por cms_codegen.ts — NÃO EDITAR
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").notNull().unique().primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name"),
});

export const tags = sqliteTable("tags", {
  id: integer("id").notNull().unique().primaryKey({ autoIncrement: true }),
  label: text("label").notNull(),
});

export const posts = sqliteTable("posts", {
  id: integer("id").notNull().unique().primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content"),
  published: integer("published").default(0),
  authorId: integer("authorId").notNull().references(() => users.id),
});

export const posts_tags = sqliteTable("posts_tags", {
  posts_id: integer("posts_id").notNull(),
  tags_id: integer("tags_id").notNull()
}); // TODO: criar unique index composto (posts_id, tags_id) via migration
