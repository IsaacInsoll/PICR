import {
  boolean,
  integer,
  pgTable,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { baseColumns } from '../column.helpers.js';
import { commentPermissionsEnum, linkModeEnum, userTypeEnum } from './enums.js';
import { relations } from 'drizzle-orm';
import { dbFolder } from './dbFolder.js';

/**
 * User accounts - handles both Admin users (username/password) and Link users (UUID-based public access).
 *
 * Two modes of operation:
 * - **Admin**: Has `username` + `hashedPassword` set. Full admin access to folders under their `folderId`.
 * - **Link**: Has `uuid` set. View-only access to folders under their `folderId`. Used for public sharing.
 *
 * The `folderId` is the user's "home folder" - they can only access content within this folder's subtree.
 * `folderId = 1` (root) grants access to everything.
 *
 * @see AGENTS.md "User Model & Access" section for detailed access control documentation
 */
export const dbUser = pgTable('Users', {
  ...baseColumns,
  name: varchar('name', { length: 255 }).notNull(),
  enabled: boolean('enabled').notNull(),
  deleted: boolean('deleted').notNull().default(false),
  commentPermissions: commentPermissionsEnum().notNull(),
  folderId: integer('folderId')
    .notNull()
    .references(() => dbFolder.id),

  lastAccess: timestamp({ withTimezone: true }),
  userType: userTypeEnum().notNull(),

  // IF REAL USER
  hashedPassword: varchar('hashedPassword', { length: 255 }),
  username: varchar('username', { length: 255 }),
  ntfy: varchar('ntfy', { length: 255 }), // phone notifications via NTFY app
  ntfyEmail: boolean('ntfyEmail').notNull().default(false),

  // IF PUBLIC LINK
  uuid: varchar('uuid', { length: 255 }),
  linkMode: linkModeEnum(),
});

export const dbUserRelations = relations(dbUser, ({ one }) => ({
  folder: one(dbFolder, {
    fields: [dbUser.folderId],
    references: [dbFolder.id],
  }),
}));
