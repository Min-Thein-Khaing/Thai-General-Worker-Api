
import { pgEnum, pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', [
  'ADMIN',
  'MANAGER',
  'GENERAL_WORKER',
]);

export const user = pgTable('user', {
    id: uuid('id').primaryKey().defaultRandom(),
    fullName: text('full_name').notNull(),
    email: text('email').notNull().unique(),
    password: text('password').notNull(),
    role: userRoleEnum('role').notNull().default('GENERAL_WORKER'),
    imageUrl: text('image_url'),
    refreshToken: text('refresh_token'),
    isArchived: boolean('is_archived').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type User = typeof user.$inferSelect
export type NewUser = typeof user.$inferInsert