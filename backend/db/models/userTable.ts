import {
  boolean,
  integer,
  pgTable,
  varchar,
  timestamp,
} from 'drizzle-orm/pg-core';
import { baseColumns } from '../column.helpers';
import { commentPermissionsEnum, userTypeEnum } from './enums';
import { folderTable } from './folderTable';
import { relations } from 'drizzle-orm';
import { fileTable } from './fileTable';

export const userTable = pgTable('Users', {
  ...baseColumns,
  name: varchar('name', { length: 255 }),
  enabled: boolean('enabled'),
  commentPermissions: commentPermissionsEnum(),
  folderId: integer('folderId').references(() => folderTable.id),

  // IF REAL USER
  hashedPassword: varchar('hashedPassword', { length: 255 }),
  username: varchar('username', { length: 255 }),

  // IF PUBLIC LINK
  uuid: varchar('uuid', { length: 255 }),
  lastAccess: timestamp({ withTimezone: true }),
  userType: userTypeEnum(),
});

export const userRelations = relations(fileTable, ({ one, many }) => ({
  folder: one(folderTable, {
    fields: [fileTable.id],
    references: [folderTable.id],
  }),
}));
