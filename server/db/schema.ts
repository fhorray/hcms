import { sqliteTable, integer, text, real, index, uniqueIndex, primaryKey } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: text('id')
        .primaryKey()
        .$defaultFn(() => createId()),
  email: text('email').notNull(),
  name: text('name')
}, (t) => [
  index('users_email_idx').on(t.email),
  uniqueIndex('users_email_uniq').on(t.email)
]);

export const tags = sqliteTable('tags', {
  id: text('id')
        .primaryKey()
        .$defaultFn(() => createId()),
  label: text('label', { enum: ["tech","news","sports"] })
});

