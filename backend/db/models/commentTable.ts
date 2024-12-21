import { boolean, integer, pgTable, text, varchar } from 'drizzle-orm/pg-core';
import { fileTable } from './fileTable';
import { userTable } from './userTable';
import { baseColumns } from '../column.helpers';
import { folderTable } from './folderTable';
import { relations } from 'drizzle-orm';

export const commentTable = pgTable('Comments', {
  ...baseColumns,
  folderId: integer('folderId').references(() => folderTable.id),
  fileId: integer('fileId').references(() => fileTable.id),
  userId: integer('userId').references(() => userTable.id),
  systemGenerated: boolean('systemGenerated'),
  nickName: varchar('nickName', { length: 255 }), // user-entered name (optional)
  comment: text('comment'), // user-entered name (optional)
});

export const CommentRelations = relations(commentTable, ({ one }) => ({
  user: one(userTable, {
    fields: [commentTable.userId],
    references: [userTable.id],
  }),
  folder: one(folderTable, {
    fields: [commentTable.folderId],
    references: [folderTable.id],
  }),
  file: one(fileTable, {
    fields: [commentTable.fileId],
    references: [fileTable.id],
  }),
}));

// todo: this
// export const CommentFor = async (
//   file: File,
//   user: User,
//   systemGenerated?: object,
// ) => {
//   const c = new Comment();
//   c.folderId = file.folderId;
//   c.fileId = file.id;
//   c.userId = user.id;
//   if (systemGenerated) {
//     c.systemGenerated = true;
//     c.comment = JSON.stringify(systemGenerated);
//     await c.save();
//   } else {
//     c.systemGenerated = false;
//   }
//   return c;
// };
