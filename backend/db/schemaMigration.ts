import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { picrConfig } from '../config/picrConfig';

// This handles SQL/ORM DB changes, see dbMigrate.ts for "picr" DB changes
export async function schemaMigration() {
  // console.log('🗃️  Migrations Starting');
  // This is same as picrDB but with a max: 1 because drizzle says to do that for migrations
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
    max: 1,
  });
  const migrationClient = drizzle(pool);

  try {
    await migrate(migrationClient, {
      migrationsFolder: './backend/db/drizzle',
      // migrationsSchema: 'public',
      // migrationsTable: 'migrations',
    });
    console.log('🗃️  Migrations Complete');
  } catch (e) {
    if (e.code === 'ECONNREFUSED') {
      console.error(
        `⚠️ Unable to connect to database \`${picrConfig.databaseUrl}\`. 
   Please ensure configuration is correct and database server is running`,
      );
    } else {
      console.log('⚠️ Error during database migration: ' + e);
    }
    console.log(e.code);
    process.exit(1);
  }
}
