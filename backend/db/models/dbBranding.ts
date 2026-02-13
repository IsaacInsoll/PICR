import { integer, pgTable, varchar } from 'drizzle-orm/pg-core';
import { baseColumns } from '../column.helpers.js';
import { relations } from 'drizzle-orm';
import { primaryColorEnum, themeModeEnum } from './enums.js';
import { dbFolder } from './dbFolder.js';

/**
 * Custom branding/theming applied to folders for white-label sharing.
 *
 * - `name`: human-readable name for this branding set
 * - `logoUrl`: custom logo image URL
 * - `mode`: light/dark/auto theme
 * - `primaryColor`: accent color from Mantine's color palette
 * - `headingFontKey`: heading font key for gallery titles/section headers
 *
 * Multiple folders can share the same branding via `Folder.brandingId`.
 * Branding cascades down the folder tree - a subfolder inherits the nearest ancestor's branding.
 */
export const dbBranding = pgTable('Brandings', {
  ...baseColumns,
  name: varchar('name', { length: 255 }),
  // TODO: Remove folderId in a future release once migration is verified stable
  folderId: integer('folderId').references(() => dbFolder.id),
  logoUrl: varchar('logoUrl', { length: 255 }),
  mode: themeModeEnum(),
  primaryColor: primaryColorEnum(),
  headingFontKey: varchar('headingFontKey', { length: 64 }),
});

export const dbBrandingRelations = relations(dbBranding, ({ one, many }) => ({
  // TODO: Remove folder relation in a future release (kept for backwards compatibility)
  folder: one(dbFolder, {
    fields: [dbBranding.folderId],
    references: [dbFolder.id],
  }),
  folders: many(dbFolder),
}));
