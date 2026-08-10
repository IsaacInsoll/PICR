import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import { delay } from '../helpers/delay.js';
import { log } from '../logger.js';

// This handles SQL/ORM DB changes, see dbMigrate.ts for "picr" DB changes
// Pro Tip: if this is failing, run `npm run dk -- migrate` to do the same thing as this, but with epic debug output

type RetryPolicy = {
  attempts: number;
  delayMs: number;
};

const defaultRetryPolicy: RetryPolicy = {
  attempts: 2,
  delayMs: 10_000,
};

// Migrations run before Express listens, so DDL that cannot get its table lock
// would otherwise hang boot forever with no output. lock_timeout only applies
// while *waiting* for a lock, so it never interrupts a slow-but-progressing
// migration - only a blocked one.
const migrationLockTimeout = '15s';

const databaseUnavailableCodes = new Set([
  'ECONNREFUSED',
  'ENOTFOUND',
  'EAI_AGAIN',
  'ETIMEDOUT',
  '57P03', // postgres: the database system is starting up
]);

const lockNotAvailableCode = '55P03';

const describeError = (error: unknown): string => {
  if (error instanceof Error) return error.stack ?? error.message;
  return String(error);
};

const collectErrorCodes = (error: unknown): string[] => {
  const codes: string[] = [];
  let current: unknown = error;

  while (current && typeof current === 'object') {
    if ('code' in current && typeof current.code === 'string') {
      codes.push(current.code);
    }
    current = 'cause' in current ? current.cause : undefined;
  }

  return codes;
};

const isDatabaseUnavailableError = (error: unknown): boolean =>
  collectErrorCodes(error).some((code) => databaseUnavailableCodes.has(code));

const isLockTimeoutError = (error: unknown): boolean =>
  collectErrorCodes(error).includes(lockNotAvailableCode);

const blockingSessionHint =
  "another session is holding a lock on the tables being migrated. Find it with: SELECT pid, state, wait_event_type, left(query, 200) FROM pg_stat_activity WHERE datname = current_database() AND state <> 'idle';";

const migrationErrorCode = (error: unknown): string | undefined =>
  collectErrorCodes(error)[0];

export async function schemaMigration() {
  // This is same as picrDB but with a max: 1 because drizzle says to do that for migrations

  const dbUrl = process.env['DATABASE_URL'];
  if (!dbUrl) throw new Error('DATABASE_URL environment variable is required');
  const pool = new pg.Pool({
    connectionString: dbUrl,
    max: 1,
    options: `-c lock_timeout=${migrationLockTimeout}`,
  });
  const migrationClient = drizzle(pool);

  try {
    log('info', '🗃️  Migrations Starting', true);
    await runMigrationsWithRetry(migrationClient, defaultRetryPolicy);
    log('info', '🗃️  Migrations Complete', true);
  } finally {
    await pool.end();
  }
}

const runMigrationsWithRetry = async (
  migrationClient: ReturnType<typeof drizzle>,
  retryPolicy: RetryPolicy,
) => {
  for (let attempt = 1; attempt <= retryPolicy.attempts; attempt++) {
    try {
      await migrate(migrationClient, {
        migrationsFolder: './backend/db/drizzle',
      });
      return;
    } catch (error: unknown) {
      const isUnavailable = isDatabaseUnavailableError(error);
      const isLockTimeout = isLockTimeoutError(error);
      const isRetryable = isUnavailable || isLockTimeout;
      const retryRemaining = attempt < retryPolicy.attempts;

      if (isRetryable && retryRemaining) {
        const reason = isLockTimeout
          ? 'Database migration blocked waiting for a table lock'
          : 'Database unavailable for migrations';
        log(
          'warn',
          `⚠️ ${reason}. Waiting ${retryPolicy.delayMs / 1000}s before retry ${attempt + 1}/${retryPolicy.attempts}...`,
          true,
        );
        log('error', describeError(error));
        await delay(retryPolicy.delayMs);
        continue;
      }

      // Throw with context and let the caller (server.ts) render the fatal
      // banner, rather than exiting here and bypassing it.
      const code = String(migrationErrorCode(error));
      if (isLockTimeout) {
        throw new Error(
          `Database migration timed out waiting for a table lock after ${retryPolicy.attempts} attempts — ${blockingSessionHint} (code: ${code})`,
        );
      }
      if (isUnavailable) {
        throw new Error(
          `Unable to connect to the database after ${retryPolicy.attempts} attempts — ensure the database is running and DATABASE_URL is correct (code: ${code})`,
        );
      }
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(`Database migration failed (code: ${code}): ${detail}`);
    }
  }
};
