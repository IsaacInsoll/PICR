import {
  boolean,
  integer,
  pgTable,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { dbFile } from './dbFile.js';
import { baseColumns } from '../column.helpers.js';
import { relations } from 'drizzle-orm';

/**
 * Folder hierarchy mirroring the filesystem structure.
 *
 * - Self-referential via `parentId` to form a tree structure
 * - Root folder (id=1) has `parentId = null` and `relativePath = null`
 * - `exists` flag is used during boot to detect deleted folders (set false, then true when found)
 * - `heroImageId` optionally points to a featured image for the folder thumbnail
 * - `folderHash` is used for cache invalidation
 */
export const dbFolder = pgTable('Folders', {
  ...baseColumns,
  name: varchar('name', { length: 255 }).notNull(),
  folderHash: varchar('folderHash', { length: 255 }),
  relativePath: varchar('relativePath', { length: 255 }), // can't be null because of root folder
  exists: boolean('exists').notNull(), // bulk set as 'false' at boot, then set true when detected, to weed out files deleted while server down
  existsRescan: boolean('existsRescan').notNull().default(false), // used to detect if files still exist at boot time
  folderLastModified: timestamp('folderLastModified', {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  parentId: integer('parentId')
    // .notNull() root folder :/
    .references((): any => dbFolder.id),
  heroImageId: integer('heroImageId')
    // .notNull()
    .references((): any => dbFile.id),
});

export const dbFolderRelations = relations(dbFolder, ({ one, many }) => ({
  parent: one(dbFolder, {
    fields: [dbFolder.parentId],
    references: [dbFolder.id],
  }),
  heroImage: one(dbFile, {
    fields: [dbFolder.heroImageId],
    references: [dbFile.id],
  }),
  files: many(dbFile),
}));
