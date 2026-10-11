import { pgTable, text, timestamp, uuid,boolean } from 'drizzle-orm/pg-core';
import { user } from './user.js';

export const company = pgTable('company', {
  id: uuid('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  companyName: text('company_name').notNull(),
  address: text('address'),
  phone: text('phone'),
  contactEmail: text('contact_email'),
  isArchived: boolean('is_archived').default(false).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Company = typeof company.$inferSelect
export type NewCompany = typeof company.$inferInsert