import { bigint, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { user } from './user.js';
import { worker } from './worker.js';

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
  mimeType: text('mime_type').notNull(),
  size: bigint('size', { mode: 'number' }).notNull(), // bytes
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Document = typeof document.$inferSelect;
export type NewDocument = typeof document.$inferInsert;