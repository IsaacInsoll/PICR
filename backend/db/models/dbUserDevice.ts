import { boolean, integer, pgTable, varchar } from 'drizzle-orm/pg-core';
import { baseColumns } from '../column.helpers.js';
import { relations } from 'drizzle-orm';
import { dbUser } from './dbUser.js';

export const dbUserDevice = pgTable('UserDevice', {
  ...baseColumns,
  userId: integer('userId').references(() => dbUser.id),
  name: varchar('name', { length: 255 }),
  notificationToken: varchar('notificationToken', { length: 255 }),
  enabled: boolean('enabled').notNull(),
});

export const dbUserDeviceRelations = relations(dbUserDevice, ({ one }) => ({
  user: one(dbUser, {
    fields: [dbUserDevice.userId],
    references: [dbUser.id],
  }),
}));
