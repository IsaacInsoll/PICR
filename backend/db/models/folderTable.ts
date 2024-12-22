import { boolean, integer, pgTable, varchar } from 'drizzle-orm/pg-core';
import { fileTable } from './fileTable';
import { baseColumns } from '../column.helpers';
import { relations } from 'drizzle-orm';

export const folderTable = pgTable('Folders', {
  ...baseColumns,
  name: varchar('name', { length: 255 }),
  folderHash: varchar('folderHash', { length: 255 }),
  relativePath: varchar('relativePath', { length: 255 }),
  exists: boolean('exists'), // bulk set as 'false' at boot, then set true when detected, to weed out files deleted while server down
  parentId: integer('parentId').references(() => folderTable.id),
  heroImageId: integer('heroImageId').references(() => fileTable.id),
});

export const folderRelations = relations(folderTable, ({ one, many }) => ({
  parent: one(folderTable, {
    fields: [folderTable.parentId],
    references: [folderTable.id],
  }),
  heroImage: one(fileTable, {
    fields: [folderTable.heroImageId],
    references: [fileTable.id],
  }),
  files: many(fileTable),
}));
