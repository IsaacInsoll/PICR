import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import { picrConfig } from '../config/picrConfig.js';
import { log } from '../logger.js';

// This handles SQL/ORM DB changes, see dbMigrate.ts for "picr" DB changes
// Pro Tip: if this is failing, run `npx drizzle-kit migrate` to do the same thing as this, but with epic debug output

export async function schemaMigration() {
  // console.log('🗃️  Migrations Starting');
  // This is same as picrDB but with a max: 1 because drizzle says to do that for migrations

  const dbUrl = process.env['DATABASE_URL'];
  if (!dbUrl) throw new Error('DATABASE_URL environment variable is required');
  const pool = new pg.Pool({
    connectionString: dbUrl,
    max: 1,
  });
  const migrationClient = drizzle(pool);

  try {
    await migrate(migrationClient, {
      migrationsFolder: './backend/db/drizzle',
    });
    log('info', '🗃️  Migrations Complete', true);
  } catch (e: unknown) {
    const code = e && typeof e === 'object' && 'code' in e ? e.code : undefined;
    if (code === 'ECONNREFUSED') {
      log(
        'error',
        `⚠️ Unable to connect to database \`${picrConfig.databaseUrl}\`. 
   Please ensure configuration is correct and database server is running`,
        true,
      );
    } else {
      log('error', '⚠️ Error during database migration: ' + String(e), true);
    }
    log('error', `Migration error code: ${String(code)}`, true);
    process.exit(1);
  }
}
