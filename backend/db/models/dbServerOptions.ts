import { boolean, pgTable, varchar } from 'drizzle-orm/pg-core';
import { baseColumns } from '../column.helpers';

export const dbServerOptions = pgTable('ServerOptions', {
  ...baseColumns,
  lastBootedVersion: varchar('lastBootedVersion', { length: 255 }),
  avifEnabled: boolean('avifEnabled'),
});
