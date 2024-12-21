import { integer, pgTable } from 'drizzle-orm/pg-core';
import { userTable } from './userTable';
import { folderTable } from './folderTable';
import { baseColumns } from '../column.helpers';
import { relations } from 'drizzle-orm';

export const accessLogTable = pgTable('AccessLogs', {
  ...baseColumns,
  userId: integer('userId').references(() => userTable.id),
  folderId: integer('folderId').references(() => folderTable.id),
});

export const AccessLogRelations = relations(accessLogTable, ({ one }) => ({
  user: one(userTable, {
    fields: [accessLogTable.userId],
    references: [userTable.id],
  }),
  folder: one(folderTable, {
    fields: [accessLogTable.folderId],
    references: [folderTable.id],
  }),
}));
