// This is just convenience functions and types because sometimes Drizzle is a bit too low level

import { dbBranding, dbFile, dbFolder, dbServerOptions } from './models';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './models';
import { eq } from 'drizzle-orm';

export let db: NodePgDatabase<typeof schema>;

export const initDb = () => {
  db = drizzle(process.env.DATABASE_URL!, { schema });
  // console.log('🚀 Connected to Database');
};

export type DBFolder = typeof dbFolder.$inferSelect;
export type DBFile = typeof dbFile.$inferSelect;
//
// //untested
// export const DBFolderForId = async (
//   id: string | number | undefined,
// ): Promise<DBFolder | undefined> => {
//   if (!id) return undefined;
//   return db.query.dbFolder.findFirst({
//     where: (f, { eq }) => eq(f.id, id) && eq(f.exists, true),
//   });
// };
//
// //untested
// export const DBFileForId = async (
//   id: string | number | undefined,
// ): Promise<DBFile | undefined> => {
//   if (!id) return undefined;
//   return db.query.dbFile.findFirst({
//     where: (f, { eq }) => eq(f.id, id) && eq(f.exists, true),
//   });
// };

// TODO: better organisation of these functions

export const getServerOptions = async () => {
  const opts = await db.query.dbServerOptions.findFirst({
    where: ({ id }, { eq }) => eq(id, 1),
  });
  if (!opts) {
    return db
      .insert(dbServerOptions)
      .values({ id: 1, updatedAt: new Date() })
      .returning();
  }
  return opts!;
};

export const setServerOptions = async (
  opts: typeof dbServerOptions.$inferInsert,
) => {
  return db.update(dbServerOptions).set({ ...opts, updatedAt: new Date() });
};

//
export const brandingForFolderId = async (folderId: number) => {
  return db.query.dbBranding.findFirst({
    where: eq(dbBranding.folderId, folderId),
  });
};
