import {
  bigint,
  boolean,
  doublePrecision,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { baseColumns } from '../column.helpers.js';
import { dbFolder } from './dbFolder.js';
import { fileFlagEnum, fileTypeEnum } from './enums.js';
import { relations } from 'drizzle-orm';

/**
 * Media files (images, videos, other files) with metadata extracted during scanning.
 *
 * Key fields:
 * - `type`: Discriminator for File/Image/Video (maps to GraphQL interface)
 * - `imageRatio`: width/height for layout before image loads (images and videos only)
 * - `duration`: length in seconds (videos only)
 * - `blurHash`: tiny placeholder hash for progressive loading (images)
 * - `metadata`: JSON string with EXIF/media metadata
 * - `flag`: approval status for proofing workflows (approved/rejected/none)
 * - `exists`: set false at boot, then true when found - detects deleted files
 * - `totalComments`/`latestComment`: denormalized for performance
 */
export const dbFile = pgTable('Files', {
  ...baseColumns,
  name: varchar('name', { length: 255 }).notNull(),
  fileHash: varchar('fileHash', { length: 255 }),
  blurHash: varchar('blurHash', { length: 255 }), // string for Images describing its 'micro thumbnail' https://www.npmjs.com/package/blurhash
  relativePath: varchar('relativePath', { length: 255 }).notNull(),
  metadata: text('metadata'),
  rating: integer('rating').notNull(), // 0-5
  imageRatio: doublePrecision('imageRatio'), // width / height (used for sizing on screen elements before image is loaded
  duration: doublePrecision('duration'), // seconds (video files)
  fileSize: bigint('fileSize', { mode: 'number' }).notNull(),
  fileLastModified: timestamp('fileLastModified', {
    withTimezone: true,
  }).notNull(),
  fileCreated: timestamp('fileCreated', {
    withTimezone: true,
  }).notNull(),
  exists: boolean('exists').notNull(), // bulk set as 'false' at boot, then set true when detected, to weed out files deleted while server down
  existsRescan: boolean('existsRescan').notNull().default(false), // used to detect if files still exist at boot time
  totalComments: integer('totalComments').notNull(), //we could calculate it but this is faster and easier
  latestComment: timestamp('latestComment', { withTimezone: true }),
  folderId: integer('folderId')
    .notNull()
    .references(() => dbFolder.id),
  flag: fileFlagEnum(),
  type: fileTypeEnum(),
});

export const dbFileRelations = relations(dbFile, ({ one }) => ({
  folder: one(dbFolder, {
    fields: [dbFile.folderId],
    references: [dbFolder.id],
  }),
}));
