import { sql } from 'drizzle-orm';
import {
  check,
  date,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { user } from './user.js';
import { year } from './year.js';
import { manager } from './manager.js';
import { company } from './company.js';

export const genderEnum = pgEnum('gender', ['MALE', 'FEMALE']);
export const typeEnum = pgEnum('type', ['OLD', 'NEW']);
export const renewalDecisionValues = [
  'UNDECIDED',
  'EXTENDED',
  'NOT_EXTENDED',
] as const;

export const worker = pgTable('worker', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  managerId: uuid('manager_id')
    .notNull()
    .references(() => manager.id, { onDelete: 'restrict' }),
  yearId: uuid('year_id')
    .notNull()
    .references(() => year.id, { onDelete: 'restrict' }),
  companyId: uuid('company_id')
    .notNull()
    .references(() => company.id, { onDelete: 'restrict' }),
  passportNumber: text('passport_number'),
  workPermitNumber: text('work_permit_number'),
  ciNumber: text('ci_number'),
  typeOfBook: text('type_of_book'),
  gender: genderEnum('gender').notNull(),
  phone: text('phone'),
  type: typeEnum('type').notNull().default('NEW'),
  total: integer('total').notNull().default(0),
  deposit: integer('deposit'),
  balance: integer('balance'),
  renewalDecision: text('renewal_decision', {
    enum: renewalDecisionValues,
  })
    .default('UNDECIDED')
    .notNull(),
  workPermitVisaDate: date('work_permit_visa_date'),
  reportDate: date('report_date'),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  check('worker_total_non_negative', sql`${table.total} >= 0`),
  check(
    'worker_deposit_within_total',
    sql`${table.deposit} IS NULL OR (${table.deposit} >= 0 AND ${table.deposit} <= ${table.total})`,
  ),
  check(
    'worker_balance_matches_payment',
    sql`${table.balance} IS NULL OR ${table.balance} = ${table.total} - coalesce(${table.deposit}, 0)`,
  ),
]);

export type Worker = typeof worker.$inferSelect;
export type NewWorker = typeof worker.$inferInsert;
