import {
  boolean,
  integer,
  pgTable,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { baseColumns } from '../column.helpers';
import { commentPermissionsEnum, userTypeEnum } from './enums';
import { relations } from 'drizzle-orm';
import { dbFolder } from './dbFolder';

export const dbUser = pgTable('Users', {
  ...baseColumns,
  name: varchar('name', { length: 255 }).notNull(),
  enabled: boolean('enabled').notNull(),
  commentPermissions: commentPermissionsEnum().notNull(),
  folderId: integer('folderId')
    .notNull()
    .references(() => dbFolder.id),

  lastAccess: timestamp({ withTimezone: true }),
  userType: userTypeEnum().notNull(),

  // IF REAL USER
  hashedPassword: varchar('hashedPassword', { length: 255 }),
  username: varchar('username', { length: 255 }),

  // IF PUBLIC LINK
  uuid: varchar('uuid', { length: 255 }),
});

export const dbUserRelations = relations(dbUser, ({ one, many }) => ({
  folder: one(dbFolder, {
    fields: [dbUser.folderId],
    references: [dbFolder.id],
  }),
}));
