import { serial, timestamp } from 'drizzle-orm/pg-core';

export const baseColumns = {
  id: serial().primaryKey(),
  updatedAt: timestamp({ withTimezone: true }).notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  // deletedAt: timestamp(),
};
