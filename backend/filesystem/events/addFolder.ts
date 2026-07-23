import { folderList, pathSplit, relativePath } from '../fileManager.js';
import { updateFolderHash } from './updateFolderHash.js';
import { log } from '../../logger.js';
import { sep } from 'path';
import type { FolderFields } from '../../db/picrDb.js';
import { db } from '../../db/picrDb.js';
import { and, eq, isNull } from 'drizzle-orm';
import { dbFolder } from '../../db/models/index.js';
import { statSync } from 'node:fs';
import { picrConfig } from '../../config/picrConfig.js';
import type { QueryResult, QueryResultRow } from 'pg';
import type { PicrFileStats } from '../fileStats.js';

let rootFolder: FolderFields | undefined = undefined;

const firstReturnedRow = <T extends QueryResultRow>(
  result: T[] | QueryResult<T>,
): T | undefined => {
  return Array.isArray(result) ? result[0] : result.rows[0];
};

export const setupRootFolder = async () => {
  let root = await db.query.dbFolder.findFirst({
    where: isNull(dbFolder.parentId),
  });

  const stats = statSync(picrConfig.mediaPath);

  if (!root) {
    root = await db
      .insert(dbFolder)
      .values({
        name: 'Home',
        exists: true,
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        folderLastModified: stats.mtime,
      })
      .returning()
      .then(firstReturnedRow);
  }

  rootFolder = root;
  return root;
};

export const addFolder = async (
  path: string,
  statsProp?: PicrFileStats,
  stIno?: bigint | null,
) => {
  const relative = relativePath(path);
  if (!rootFolder)
    throw new Error('rootFolder not initialized — call setupRootFolder first');
  const root = rootFolder;
  if (relative === '') return root.id;

  const stats = statsProp ?? statSync(path);

  let f = root.id;
  const ps = pathSplit(path);
  for (let i = 0; i < ps.length; i++) {
    const p = ps.slice(0, i + 1).join(sep);

    if (folderList[p]) {
      f = folderList[p];
      continue;
    } // already in folder cache

    const props = {
      name: ps[i],
      parentId: f,
      relativePath: p,
    };

    let newFolder = await db.query.dbFolder.findFirst({
      where: and(
        eq(dbFolder.name, props.name),
        eq(dbFolder.parentId, props.parentId),
        eq(dbFolder.relativePath, props.relativePath),
      ),
    });

    if (newFolder && (!newFolder.exists || !newFolder.existsRescan)) {
      await db
        .update(dbFolder)
        .set({
          exists: true,
          existsRescan: true,
          folderLastModified: stats.mtime,
          ...(stIno && p === relative ? { stIno } : {}),
        }) // I'm intentionally not updating `lastUpdated` here (, updatedAt: new Date())
        .where(eq(dbFolder.id, newFolder.id));
      newFolder.exists = true;
      newFolder.existsRescan = true;
    }

    if (newFolder && stIno && p === relative && newFolder.stIno !== stIno) {
      await db
        .update(dbFolder)
        .set({ stIno })
        .where(eq(dbFolder.id, newFolder.id));
      newFolder.stIno = stIno;
    }

    if (!newFolder) {
      log('info', `📁➕ ${relativePath(path)} IS NEW, CREATING`);
      newFolder = await db
        .insert(dbFolder)
        .values({
          ...props,
          ...(stIno && p === relative ? { stIno } : {}),
          createdAt: new Date(),
          updatedAt: new Date(),
          exists: true,
          existsRescan: true,
          folderLastModified: stats.mtime,
        })
        .returning()
        .then(firstReturnedRow);
    }

    if (!newFolder) throw new Error('Failed to create/find folder');
    folderList[p] = newFolder.id; // for caching
    updateFolderHash(newFolder);
    f = newFolder.id;
    log('info', `📁➕ ${relativePath(path)}`);
  }
  // console.log('finished addFolder: ' + path);

  return f;
};
