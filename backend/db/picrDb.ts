// This is just convenience functions and types because sometimes Drizzle is a bit too low level

import { db } from '../server';
import { dbFile, dbFolder } from './models';

export type DBFolder = typeof dbFolder.$inferSelect;
export type DBFile = typeof dbFile.$inferSelect;

//untested
export const DBFolderForId = async (
  id: string | number | undefined,
): Promise<DBFolder | undefined> => {
  if (!id) return undefined;
  return db.query.dbFolder.findFirst({
    where: (f, { eq }) => eq(f.id, id) && eq(f.exists, true),
  });
};

//untested
export const DBFileForId = async (
  id: string | number | undefined,
): Promise<DBFile | undefined> => {
  if (!id) return undefined;
  return db.query.dbFile.findFirst({
    where: (f, { eq }) => eq(f.id, id) && eq(f.exists, true),
  });
};
