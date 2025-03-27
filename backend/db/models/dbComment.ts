import { boolean, integer, pgTable, text, varchar } from 'drizzle-orm/pg-core';
import { dbFile } from './dbFile';
import { dbUser } from './dbUser';
import { baseColumns } from '../column.helpers';
import { dbFolder } from './dbFolder';
import { relations } from 'drizzle-orm';

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
