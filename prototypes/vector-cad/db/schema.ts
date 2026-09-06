import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const sessions = sqliteTable('mdt_sessions', {
 id: text('id').primaryKey(),
 revision: integer('revision').notNull(),
 payload: text('payload').notNull(),
 updatedAt: text('updated_at').notNull(),
});
