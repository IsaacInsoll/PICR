import { boolean, pgTable, varchar } from 'drizzle-orm/pg-core';
import { baseColumns } from '../column.helpers.js';

/**
 * Singleton table for server-wide configuration (should only have one row).
 *
 * - `lastBootedVersion`: tracks version for upgrade migrations
 * - `tokenSecret`: JWT signing secret (auto-generated on first boot)
 * - `avifEnabled`: whether to generate AVIF thumbnails (experimental)
 *
 * Access via `getServerOptions()` and `setServerOptions()` in picrDb.ts.
 */
export const dbServerOptions = pgTable('ServerOptions', {
  ...baseColumns,
  lastBootedVersion: varchar('lastBootedVersion', { length: 255 }),
  tokenSecret: varchar('tokenSecret', { length: 255 }),
  avifEnabled: boolean('avifEnabled'),
});
