import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

// This handles SQL/ORM DB changes, see dbMigrate.ts for "picr" DB changes
export async function schemaMigration() {
  console.log('🗃️  Migrations Starting');
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
    console.log('🗃️ ✅ Migrations Complete');
  } catch (e) {
    console.log('⚠️ Error during database migration: ' + e);
    process.exit(1);
  }
}
