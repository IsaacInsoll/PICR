import { integer, pgTable, varchar } from 'drizzle-orm/pg-core';
import { dbUser } from './dbUser';
import { dbFolder } from './dbFolder';
import { relations } from 'drizzle-orm';
import { baseColumns } from '../column.helpers';
import { accessTypeEnum } from './enums';

export const dbAccessLog = pgTable('AccessLogs', {
  ...baseColumns,
  userId: integer('userId').references(() => dbUser.id),
  folderId: integer('folderId').references(() => dbFolder.id),
  ipAddress: varchar('ipAddress', { length: 255 }),
  sessionId: varchar('sessionId', { length: 255 }),
  userAgent: varchar('userAgent', { length: 255 }),
  type: accessTypeEnum(),
});

export const dbAccessLogRelations = relations(dbAccessLog, ({ one }) => ({
  user: one(dbUser, {
    fields: [dbAccessLog.userId],
    references: [dbUser.id],
  }),
  folder: one(dbFolder, {
    fields: [dbAccessLog.folderId],
    references: [dbFolder.id],
  }),
}));
