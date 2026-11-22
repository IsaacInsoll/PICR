import { boolean, integer, jsonb, pgTable, varchar } from 'drizzle-orm/pg-core';
import type { MediaDecodeState } from '../../media/mediaDecodeState.js';
import { baseColumns } from '../column.helpers.js';

/**
 * Singleton table for server-wide configuration (should only have one row).
 *
 * - `lastBootedVersion`: tracks version for upgrade migrations
 * - `minimumPicrVersion`: oldest PICR version allowed to boot this DB
 * - `tokenSecret`: JWT signing secret (auto-generated on first boot)
 * - media thumbnail settings: server-wide defaults for generated previews
 *
 * Access via `getServerOptions()` and `setServerOptions()` in picrDb.ts.
 */
export const dbServerOptions = pgTable('ServerOptions', {
  ...baseColumns,
  lastBootedVersion: varchar('lastBootedVersion', { length: 255 }),
  minimumPicrVersion: varchar('minimumPicrVersion', { length: 255 }),
  mediaDecodeState: jsonb('mediaDecodeState').$type<MediaDecodeState>(),
  requireAdminMfa: boolean('requireAdminMfa').notNull().default(false),
  tokenSecret: varchar('tokenSecret', { length: 255 }),
  // Legacy thumbnail columns retained for upgrade compatibility; AVIF behavior
  // is disabled at the application layer.
  avifEnabled: boolean('avifEnabled'),
  useOriginalsForLightbox: boolean('useOriginalsForLightbox'),
  thumbnailSmallPx: integer('thumbnailSmallPx'),
  thumbnailMediumPx: integer('thumbnailMediumPx'),
  thumbnailLargePx: integer('thumbnailLargePx'),
  thumbnailJpegQuality: integer('thumbnailJpegQuality'),
  thumbnailAvifQuality: integer('thumbnailAvifQuality'),
});
