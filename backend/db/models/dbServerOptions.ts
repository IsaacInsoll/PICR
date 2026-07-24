import { boolean, integer, pgTable, varchar } from 'drizzle-orm/pg-core';
import { baseColumns } from '../column.helpers.js';

/**
 * Singleton table for server-wide configuration (should only have one row).
 *
 * - `lastBootedVersion`: tracks version for upgrade migrations
 * - `minimumPicrVersion`: oldest PICR version allowed to boot this DB
 * - `tokenSecret`: JWT signing secret (auto-generated on first boot)
 * - `avifEnabled`: whether to generate AVIF thumbnails (experimental)
 * - media thumbnail settings: server-wide defaults for generated previews
 *
 * Access via `getServerOptions()` and `setServerOptions()` in picrDb.ts.
 */
export const dbServerOptions = pgTable('ServerOptions', {
  ...baseColumns,
  lastBootedVersion: varchar('lastBootedVersion', { length: 255 }),
  minimumPicrVersion: varchar('minimumPicrVersion', { length: 255 }),
  tokenSecret: varchar('tokenSecret', { length: 255 }),
  avifEnabled: boolean('avifEnabled'),
  useOriginalsForLightbox: boolean('useOriginalsForLightbox'),
  thumbnailSmallPx: integer('thumbnailSmallPx'),
  thumbnailMediumPx: integer('thumbnailMediumPx'),
  thumbnailLargePx: integer('thumbnailLargePx'),
  thumbnailJpegQuality: integer('thumbnailJpegQuality'),
  thumbnailAvifQuality: integer('thumbnailAvifQuality'),
});
