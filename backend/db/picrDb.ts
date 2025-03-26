// This is just convenience functions and types because sometimes Drizzle is a bit too low level

import { fileTable, folderTable } from './models';
import { db } from '../server';
import { eq } from 'drizzle-orm';
import { brandingTable } from './models/brandingTable';

export type DBFolder = typeof folderTable.$inferSelect;
export type DBFile = typeof fileTable.$inferSelect;

export const DBFolderForId = async (
  id: string | number | undefined,
): Promise<DBFolder | undefined> => {
  if (!id) return undefined;
  const folder = await db.query.folderTable.findFirst({
    where: eq(folderTable.id, id),
  });
  return folder;
};
export const DBFileForId = async (
  id: string | number | undefined,
): Promise<DBFile | undefined> => {
  if (!id) return undefined;
  //TODO: test this, it might possibly return wrong things (as learned from DBFolderForID above)
  return db.query.fileTable.findFirst({
    where: (f, { eq }) => eq(f.id, id) && eq(f.exists, true),
  });
};

export const getServerOptions = async () => {
  const opts = await db.query.serverOptionsTable.findFirst({
    where: ({ id }, { eq }) => eq(id, 1),
  });
  return opts!;
};

export const brandingForFolderId = async (folderId: number) => {
  return db.query.brandingTable.findFirst({
    where: eq(brandingTable.folderId, folderId),
  });
};
