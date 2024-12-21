import { pgTable, varchar } from 'drizzle-orm/pg-core';
import { baseColumns } from '../column.helpers';

export const serverOptionsTable = pgTable('ServerOptions', {
  ...baseColumns,
  lastBootedVersion: varchar('lastBootedVersion', { length: 255 }),
});
