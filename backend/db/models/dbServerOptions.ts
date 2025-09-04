import { boolean, pgTable, varchar } from 'drizzle-orm/pg-core';
import { baseColumns } from '../column.helpers.js';

export const dbServerOptions = pgTable('ServerOptions', {
  ...baseColumns,
  lastBootedVersion: varchar('lastBootedVersion', { length: 255 }),
  tokenSecret: varchar('tokenSecret', { length: 255 }),
  avifEnabled: boolean('avifEnabled'),
});
