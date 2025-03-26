import { pgTable, varchar, boolean } from 'drizzle-orm/pg-core';
import { baseColumns } from '../column.helpers';

export const serverOptionsTable = pgTable('ServerOptions', {
  ...baseColumns,
  lastBootedVersion: varchar('lastBootedVersion', { length: 255 }),
  avifEnabled: boolean('avifEnabled'),
});
