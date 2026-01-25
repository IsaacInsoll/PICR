import { integer, pgTable, varchar } from 'drizzle-orm/pg-core';
import { dbUser } from './dbUser.js';
import { dbFolder } from './dbFolder.js';
import { relations } from 'drizzle-orm';
import { baseColumns } from '../column.helpers.js';
import { accessTypeEnum } from './enums.js';

/**
 * Tracks user access events for analytics and audit purposes.
 *
 * - `type`: View (gallery opened) or Download (file downloaded)
 * - `sessionId`: groups actions within a browser session
 * - `ipAddress`/`userAgent`: for identifying unique visitors
 *
 * Used primarily for Link users to show gallery owners who accessed their shares.
 * Has deduplication logic in `createAccessLog()` to avoid spam entries.
 */
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
