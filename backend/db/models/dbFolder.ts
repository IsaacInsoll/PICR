import { boolean, integer, pgTable, varchar } from 'drizzle-orm/pg-core';
import { dbFile } from './dbFile';
import { baseColumns } from '../column.helpers';
import { relations } from 'drizzle-orm';

export const dbFolder = pgTable('Folders', {
  ...baseColumns,
  name: varchar('name', { length: 255 }).notNull(),
  folderHash: varchar('folderHash', { length: 255 }),
  relativePath: varchar('relativePath', { length: 255 }), // can't be null because of root folder
  exists: boolean('exists').notNull(), // bulk set as 'false' at boot, then set true when detected, to weed out files deleted while server down
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
