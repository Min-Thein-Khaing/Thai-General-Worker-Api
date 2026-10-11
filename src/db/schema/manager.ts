import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { user } from './user.js';
import { company } from './company.js';

export const manager = pgTable('manager', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  companyId: uuid('company_id')
    .notNull()
    .references(() => company.id, { onDelete: 'restrict' }),
  gender: text('gender'),
  phone: text('phone'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
export type Manager = typeof manager.$inferSelect
export type NewManager = typeof manager.$inferInsert
