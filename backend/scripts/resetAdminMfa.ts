import { parseArgs } from 'node:util';
import { eq, sql } from 'drizzle-orm';
import { configFromEnv } from '../config/configFromEnv.js';
import { db, initDb } from '../db/picrDb.js';
import {
  dbAdminSecurity,
  dbServerOptions,
  dbUser,
} from '../db/models/index.js';
import { revokeAdminSessions } from '../auth/adminSessions.js';
import { log } from '../logger.js';

const { values } = parseArgs({
  options: {
    username: { type: 'string' },
    confirm: { type: 'string' },
    'disable-policy': { type: 'boolean', default: false },
  },
});
if (!values.username || values.confirm !== values.username)
  throw new Error(
    'Usage: npm run auth:reset -- --username <username> --confirm <username>. This removes that admin’s authenticator and recovery codes and revokes all their sessions.',
  );
configFromEnv();
const pool = initDb();
try {
  await db.transaction(async (tx) => {
    const user = (
      await tx
        .select()
        .from(dbUser)
        .where(eq(dbUser.username, values.username ?? ''))
        .for('update')
    ).at(0);
    if (user?.userType !== 'Admin' || user.deleted)
      throw new Error('No active admin found with that exact username');
    if (values['disable-policy']) {
      if (user.folderId !== 1)
        throw new Error('--disable-policy requires a root-scoped admin');
      await tx
        .update(dbServerOptions)
        .set({ requireAdminMfa: false })
        .where(eq(dbServerOptions.id, 1));
    }
    await tx.delete(dbAdminSecurity).where(eq(dbAdminSecurity.userId, user.id));
    await tx
      .update(dbUser)
      .set({ authVersion: sql`${dbUser.authVersion} + 1` })
      .where(eq(dbUser.id, user.id));
    await revokeAdminSessions(tx, user.id);
    log(
      'warn',
      `Local administrator recovery reset 2FA and revoked sessions for user ID ${user.id}. ${values['disable-policy'] ? 'Server-wide enforcement was explicitly disabled.' : 'Server-wide enforcement remains unchanged; enroll again on the next login.'}`,
      true,
    );
  });
} finally {
  await pool.end();
}
