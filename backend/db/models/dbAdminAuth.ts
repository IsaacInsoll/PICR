import {
  boolean,
  integer,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { dbUser } from './dbUser.js';

export const dbAdminSecurity = pgTable('AdminSecurity', {
  userId: integer('userId')
    .primaryKey()
    .references(() => dbUser.id, { onDelete: 'cascade' }),
  secret: text('secret'),
  pendingSecret: text('pendingSecret'),
  pendingExpiresAt: timestamp('pendingExpiresAt', { withTimezone: true }),
  enabled: boolean('enabled').notNull().default(false),
  lastTimeStep: integer('lastTimeStep').notNull().default(0),
  recoveryHashes: text('recoveryHashes').array().notNull().default([]),
});

export const dbAuthSession = pgTable(
  'AuthSessions',
  {
    id: uuid('id').primaryKey(),
    userId: integer('userId')
      .notNull()
      .references(() => dbUser.id, { onDelete: 'cascade' }),
    authVersion: integer('authVersion').notNull(),
    secondFactor: boolean('secondFactor').notNull(),
    expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull(),
    revoked: boolean('revoked').notNull().default(false),
  },
  (table) => [
    index('auth_sessions_user_idx').on(table.userId),
    index('auth_sessions_expiry_idx').on(table.expiresAt),
  ],
);

export const dbRefreshToken = pgTable(
  'AuthRefreshTokens',
  {
    hash: varchar('hash', { length: 64 }).primaryKey(),
    sessionId: uuid('sessionId')
      .notNull()
      .references(() => dbAuthSession.id, { onDelete: 'cascade' }),
    usedAt: timestamp('usedAt', { withTimezone: true }),
  },
  (table) => [
    index('auth_refresh_session_idx').on(table.sessionId),
    index('auth_refresh_used_idx').on(table.usedAt),
  ],
);

export const dbAuthChallenge = pgTable(
  'AuthChallenges',
  {
    hash: varchar('hash', { length: 64 }).primaryKey(),
    userId: integer('userId')
      .notNull()
      .references(() => dbUser.id, { onDelete: 'cascade' }),
    authVersion: integer('authVersion').notNull(),
    purpose: varchar('purpose', { length: 16 }).notNull(),
    expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull(),
    attempts: integer('attempts').notNull().default(0),
  },
  (table) => [
    index('auth_challenges_user_idx').on(table.userId),
    index('auth_challenges_expiry_idx').on(table.expiresAt),
  ],
);
