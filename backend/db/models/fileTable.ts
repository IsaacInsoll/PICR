import {
  bigint,
  boolean,
  date,
  doublePrecision,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { baseColumns } from '../column.helpers';
import { folderTable } from './folderTable';
import { fileFlagEnum, fileTypeEnum } from './enums';
import { relations } from 'drizzle-orm';

export const fileTable = pgTable('Files', {
  ...baseColumns,
  name: varchar('name', { length: 255 }),
  fileHash: varchar('fileHash', { length: 255 }),
  blurHash: varchar('blurHash', { length: 255 }), // string for Images describing its 'micro thumbnail' https://www.npmjs.com/package/blurhash
  relativePath: varchar('relativePath', { length: 255 }),
  metadata: text('metadata'),
  rating: integer('rating'), // 0-5
  imageRatio: doublePrecision('imageRatio'), // width / height (used for sizing on screen elements before image is loaded
  duration: doublePrecision('duration'), // seconds (video files)
  fileSize: bigint('fileSize', { mode: 'number' }),
  fileLastModified: timestamp('fileLastModified', { withTimezone: true }),
  exists: boolean('exists'), // bulk set as 'false' at boot, then set true when detected, to weed out files deleted while server down
  totalComments: integer('totalComments'), //we could calculate it but this is faster and easier
  latestComment: timestamp('latestComment', { withTimezone: true }),
  folderId: integer('folderId').references(() => folderTable.id),
  flag: fileFlagEnum(),
  type: fileTypeEnum(),
});

export const fileRelations = relations(fileTable, ({ one }) => ({
  folder: one(folderTable, {
    fields: [fileTable.folderId],
    references: [folderTable.id],
  }),
}));