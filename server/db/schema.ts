import { sqliteTable, integer, text, real, index, uniqueIndex, primaryKey } from 'drizzle-orm/sqlite-core';
import { init } from '@paralleldrive/cuid2';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: text('id').primaryKey().notNull().$defaultFn(() => init({ length: 10 })()),
  email: text('email').notNull(),
  name: text('name')
}, (t) => [
  index('users_email_idx').on(t.email),
  uniqueIndex('users_email_uniq').on(t.email)
]);

export const tags = sqliteTable('tags', {
  id: text('id').primaryKey().notNull().$defaultFn(() => init({ length: 10 })()),
  label: text('label', { enum: ["tech","news","sports","others"] })
});

export const products = sqliteTable('products', {
  id: text('id').primaryKey().notNull().$defaultFn(() => init({ length: 10 })()),
  title: text('title').notNull(),
  price: real('price').notNull(),
  inStock: integer('inStock', { mode: 'boolean' }).default(true),
  tags: text('tags'),
  description: text('description'),
  releaseDate: integer('releaseDate')
}, (t) => [
  index('products_title_idx').on(t.title),
  index('products_price_idx').on(t.price),
  index('products_inStock_idx').on(t.inStock)
]);

