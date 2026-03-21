import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import { picrConfig } from '../config/picrConfig.js';
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

const databaseUnavailableCodes = new Set([
  'ECONNREFUSED',
  'ENOTFOUND',
  'EAI_AGAIN',
  'ETIMEDOUT',
  '57P03', // postgres: the database system is starting up
]);

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

const migrationErrorCode = (error: unknown): string | undefined =>
  collectErrorCodes(error)[0];

export async function schemaMigration() {
  // console.log('🗃️  Migrations Starting');
  // This is same as picrDB but with a max: 1 because drizzle says to do that for migrations

  const dbUrl = process.env['DATABASE_URL'];
  if (!dbUrl) throw new Error('DATABASE_URL environment variable is required');
  const pool = new pg.Pool({ connectionString: dbUrl, max: 1 });
  const migrationClient = drizzle(pool);

  try {
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
      const isRetryable = isDatabaseUnavailableError(error);
      const retryRemaining = attempt < retryPolicy.attempts;

      if (isRetryable && retryRemaining) {
        log(
          'warning',
          `⚠️ Database unavailable for migrations. Waiting ${retryPolicy.delayMs / 1000}s before retry ${attempt + 1}/${retryPolicy.attempts}...`,
          true,
        );
        log('error', describeError(error));
        await delay(retryPolicy.delayMs);
        continue;
      }

      if (isRetryable) {
        log(
          'error',
          `⚠️ Unable to connect to database \`${picrConfig.databaseUrl}\` after ${retryPolicy.attempts} attempts. 
   Please ensure configuration is correct and database server is running`,
          true,
        );
      } else {
        log(
          'error',
          '⚠️ Error during database migration: ' + describeError(error),
          true,
        );
      }

      log(
        'error',
        `Migration error code: ${String(migrationErrorCode(error))}`,
        true,
      );
      process.exit(1);
    }
  }
};
