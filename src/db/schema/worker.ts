import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { user } from './user.js';
import { year } from './year.js';
import { manager } from './manager.js';

export const genderEnum = pgEnum('gender', ['MALE', 'FEMALE']);

export const worker = pgTable('worker', {
  id: uuid('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  managerId: text('manager_id')
    .notNull()
    .references(() => manager.id, { onDelete: 'restrict' }),
  yearId: text('year_id')
    .notNull()
    .references(() => year.id, { onDelete: 'restrict' }),
  companyId: text('company_id')
    .notNull()
    .references(() => manager.companyId, { onDelete: 'restrict' }),
  passportNumber: text('passport_number'),
  workPermitNumber: text('work_permit_number'),
  ciNumber: text('ci_number'),
  typeOfBook: text('type_of_book'),
  gender: genderEnum('gender').notNull(),
  phone: text('phone'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Worker = typeof worker.$inferSelect;
export type NewWorker = typeof worker.$inferInsert;
