import { integer, pgTable, varchar } from 'drizzle-orm/pg-core';
import { baseColumns } from '../column.helpers.js';
import { relations } from 'drizzle-orm';
import { primaryColorEnum, themeModeEnum } from './enums.js';
import { dbFolder } from './dbFolder.js';

/**
 * Custom branding/theming applied to folders for white-label sharing.
 *
 * - `folderId`: the folder this branding applies to (inherited by subfolders)
 * - `logoUrl`: custom logo image URL
 * - `mode`: light/dark/auto theme
 * - `primaryColor`: accent color from Mantine's color palette
 * - `headingFontKey`: heading font key for gallery titles/section headers
 *
 * Branding cascades down the folder tree - a subfolder uses the nearest ancestor's branding.
 */
export const dbBranding = pgTable('Brandings', {
  ...baseColumns,
  folderId: integer('folderId').references(() => dbFolder.id),
  logoUrl: varchar('logoUrl', { length: 255 }),
  mode: themeModeEnum(),
  primaryColor: primaryColorEnum(),
  headingFontKey: varchar('headingFontKey', { length: 64 }),
});

export const dbBrandingRelations = relations(dbBranding, ({ one }) => ({
  folder: one(dbFolder, {
    fields: [dbBranding.folderId],
    references: [dbFolder.id],
  }),
}));
