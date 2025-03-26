import { integer, pgTable, varchar } from 'drizzle-orm/pg-core';
import { baseColumns } from '../column.helpers';
import { folderTable } from './folderTable';
import { relations } from 'drizzle-orm';
import { primaryColorEnum, themeModeEnum } from './enums';

export const brandingTable = pgTable('Brandings', {
  ...baseColumns,
  folderId: integer('folderId').references(() => folderTable.id),
  logoUrl: varchar('logoUrl', { length: 255 }),
  mode: themeModeEnum(),
  primaryColor: primaryColorEnum(),
});

export const BrandingRelations = relations(brandingTable, ({ one }) => ({
  folder: one(folderTable, {
    fields: [brandingTable.folderId],
    references: [folderTable.id],
  }),
}));
