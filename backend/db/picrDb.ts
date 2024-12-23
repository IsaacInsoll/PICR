// This is just convenience functions and types because sometimes Drizzle is a bit too low level

import { fileTable, folderTable } from './models';
import { db } from '../server';

export type DBFolder = typeof folderTable.$inferSelect;
export type DBFile = typeof fileTable.$inferSelect;

export const DBFolderForId = async (
  id: string | number | undefined,
): Promise<DBFolder | undefined> => {
  if (!id) return undefined;
  return db.query.folderTable.findFirst({
    where: (f, { eq }) => eq(f.id, id) && eq(f.exists, true),
  });
};
export const DBFileForId = async (
  id: string | number | undefined,
): Promise<DBFile | undefined> => {
  if (!id) return undefined;
  return db.query.fileTable.findFirst({
    where: (f, { eq }) => eq(f.id, id) && eq(f.exists, true),
  });
};
