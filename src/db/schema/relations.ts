import { relations } from 'drizzle-orm';
import { company } from './company.js';
import { document } from './documentation.js';
import { manager } from './manager.js';
import { user } from './user.js';
import { worker } from './worker.js';
import { year } from './year.js';

export const userRelations = relations(user, ({ many }) => ({
  companies: many(company),
  managers: many(manager),
  years: many(year),
  workers: many(worker),
  documents: many(document),
}));

export const companyRelations = relations(company, ({ one, many }) => ({
  user: one(user, {
    fields: [company.userId],
    references: [user.id],
  }),
  managers: many(manager),
  workers: many(worker),
}));

export const managerRelations = relations(manager, ({ one, many }) => ({
  user: one(user, {
    fields: [manager.userId],
    references: [user.id],
  }),
  company: one(company, {
    fields: [manager.companyId],
    references: [company.id],
  }),
  workers: many(worker),
}));

export const yearRelations = relations(year, ({ one, many }) => ({
  user: one(user, {
    fields: [year.userId],
    references: [user.id],
  }),
  workers: many(worker),
}));

export const workerRelations = relations(worker, ({ one, many }) => ({
  user: one(user, {
    fields: [worker.userId],
    references: [user.id],
  }),
  manager: one(manager, {
    fields: [worker.managerId],
    references: [manager.id],
  }),
  year: one(year, {
    fields: [worker.yearId],
    references: [year.id],
  }),
  company: one(company, {
    fields: [worker.companyId],
    references: [company.id],
  }),
  documents: many(document),
}));

export const documentRelations = relations(document, ({ one }) => ({
  user: one(user, {
    fields: [document.userId],
    references: [user.id],
  }),
  worker: one(worker, {
    fields: [document.workerId],
    references: [worker.id],
  }),
}));
