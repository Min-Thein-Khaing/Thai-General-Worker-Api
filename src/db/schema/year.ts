import { date, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { user } from './user.js';

export const year = pgTable('year', {
  id: uuid('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  startYear: date('start_year').notNull(),
  endYear: date('end_year').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Year = typeof year.$inferSelect
export type NewYear = typeof year.$inferInsert