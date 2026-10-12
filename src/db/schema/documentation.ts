import {
  bigint,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { user } from './user.js';
import { worker } from './worker.js';

export const DOCUMENT_TYPE_VALUES = [
  'PAYMENT_SLIP_100',
  'PAYMENT_SLIP_900',
  'PAW_TAW_50',
  'BLOOD_TEST_CERTIFICATE',
  'PA_KAN_DOCUMENT',
  'BINU_MAT_DOCUMENT',
  'WORK_PERMIT_DOCUMENT',
  'NEW_WORKER_QR_APPOINTMENT',
] as const;

export const documentTypeEnum = pgEnum('document_type', DOCUMENT_TYPE_VALUES);

export type DocumentType = (typeof documentTypeEnum.enumValues)[number];

export const document = pgTable('document', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  workerId: uuid('worker_id')
    .notNull()
    .references(() => worker.id, { onDelete: 'cascade' }),
  objectKey: text('object_key').notNull().unique(),
  originalName: text('original_name').notNull(),
  documentType: documentTypeEnum('document_type').notNull(),
  mimeType: text('mime_type').notNull(),
  size: bigint('size', { mode: 'number' }).notNull(), // bytes
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Document = typeof document.$inferSelect;
export type NewDocument = typeof document.$inferInsert;
