import { boolean, integer, pgTable, text, varchar } from 'drizzle-orm/pg-core';
import { dbFile } from './dbFile.js';
import { dbUser } from './dbUser.js';
import { baseColumns } from '../column.helpers.js';
import { dbFolder } from './dbFolder.js';
import { relations } from 'drizzle-orm';

/**
 * Comments on files, supporting both user comments and system-generated messages.
 *
 * - `fileId`: the file being commented on
 * - `folderId`: denormalized for efficient folder-level queries
 * - `userId`: the commenter (null for anonymous/system)
 * - `nickName`: optional display name entered by the user
 * - `systemGenerated`: true for auto-generated comments (e.g., approval notifications)
 *
 * Comment permissions are controlled per-user via `dbUser.commentPermissions`.
 */
export const dbComment = pgTable('Comments', {
  ...baseColumns,
  folderId: integer('folderId').references(() => dbFolder.id),
  fileId: integer('fileId').references(() => dbFile.id),
  userId: integer('userId').references(() => dbUser.id),
  systemGenerated: boolean('systemGenerated'),
  nickName: varchar('nickName', { length: 255 }), // user-entered name (optional)
  comment: text('comment'), // user-entered name (optional)
});

export const dbCommentRelations = relations(dbComment, ({ one }) => ({
  user: one(dbUser, {
    fields: [dbComment.userId],
    references: [dbUser.id],
  }),
  folder: one(dbFolder, {
    fields: [dbComment.folderId],
    references: [dbFolder.id],
  }),
  file: one(dbFile, {
    fields: [dbComment.fileId],
    references: [dbFile.id],
  }),
}));
