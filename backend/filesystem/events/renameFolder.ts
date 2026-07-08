import { basename, dirname } from 'path';
import { addFolder } from './addFolder.js';
import { folderList, relativePath } from '../fileManager.js';
import { db } from '../../db/picrDb.js';
import { and, eq, like, or, sql } from 'drizzle-orm';
import { dbFile, dbFolder } from '../../db/models/index.js';
import { moveThumbnailFolder } from '../../media/moveThumbnailFolder.js';
import type { PicrFileStats } from '../fileStats.js';

export const renameFolder = async (
  oldPath: string,
  newPath: string,
  stats?: PicrFileStats,
  stIno?: bigint | null,
) => {
  const oldRelative = relativePath(oldPath);
  const newRelative = relativePath(newPath);

  if (!oldRelative || !newRelative || oldRelative === newRelative) {
    await addFolder(newPath, stats, stIno);
    return;
  }

  const folder = await db.query.dbFolder.findFirst({
    where: eq(dbFolder.relativePath, oldRelative),
  });

  if (!folder) {
    await addFolder(newPath, stats, stIno);
    return;
  }

  const newName = basename(newPath);
  const parentPath = dirname(newPath);
  const parentId = await addFolder(parentPath);

  await db
    .update(dbFolder)
    .set({
      name: newName,
      parentId: parentId,
      relativePath: newRelative,
      exists: true,
      existsRescan: true,
      ...(stIno ? { stIno } : {}),
      folderLastModified: stats?.mtime ?? folder.folderLastModified,
      updatedAt: new Date(),
    })
    .where(eq(dbFolder.id, folder.id));

  await db
    .update(dbFolder)
    .set({
      relativePath: sql`REGEXP_REPLACE(${dbFolder.relativePath}, ${'^' + escapeRegExp(oldRelative)}, ${escapeRegExp(newRelative)})`,
    })
    .where(
      and(
        like(dbFolder.relativePath, oldRelative + '/%'),
        eq(dbFolder.exists, true),
      ),
    );

  await db
    .update(dbFile)
    .set({
      relativePath: sql`REGEXP_REPLACE(${dbFile.relativePath}, ${'^' + escapeRegExp(oldRelative)}, ${escapeRegExp(newRelative)})`,
    })
    .where(
      and(
        or(
          eq(dbFile.relativePath, oldRelative),
          like(dbFile.relativePath, oldRelative + '/%'),
        ),
        eq(dbFile.exists, true),
      ),
    );

  await db
    .update(dbFile)
    .set({
      folderId: sql`(SELECT ${dbFolder.id} FROM ${dbFolder} WHERE ${dbFolder.relativePath} = ${dbFile.relativePath} AND ${dbFolder.exists} = true LIMIT 1)`,
    })
    .where(
      and(
        or(
          eq(dbFile.relativePath, newRelative),
          like(dbFile.relativePath, newRelative + '/%'),
        ),
        eq(dbFile.exists, true),
      ),
    );

  updateFolderListPaths(oldRelative, newRelative);
  await moveThumbnailFolder(oldRelative, newRelative);
};

const updateFolderListPaths = (oldPath: string, newPath: string) => {
  const updates: Array<[string, string, number]> = [];
  Object.entries(folderList).forEach(([path, id]) => {
    if (!id) return;
    if (path === oldPath || path.startsWith(oldPath + '/')) {
      updates.push([path, newPath + path.slice(oldPath.length), id]);
    }
  });

  updates.forEach(([oldKey]) => {
    delete folderList[oldKey];
  });

  updates.forEach(([, newKey, id]) => {
    folderList[newKey] = id;
  });
};

const escapeRegExp = (input: string): string => {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
