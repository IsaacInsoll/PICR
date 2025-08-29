import { folderList, pathSplit, relativePath } from '../fileManager.js';
import { updateFolderHash } from './updateFolderHash.js';
import { log } from '../../logger.js';
import { sep } from 'path';
import { db, FolderFields } from '../../db/picrDb.js';
import { and, eq, isNull } from 'drizzle-orm';
import { dbFolder } from '../../db/models/index.js';
import { Stats, statSync } from 'node:fs';
import { picrConfig } from '../../config/picrConfig.js';

let rootFolder: FolderFields | undefined = undefined;

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
      .then((f) => f[0]);
  }

  rootFolder = root;
  return root;
};

export const addFolder = async (path: string, statsProp?: Stats) => {
  const relative = relativePath(path);
  const root = rootFolder!;
  if (relative === '') return root;

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

    if (newFolder && !newFolder.existsRescan) {
      await db
        .update(dbFolder)
        .set({
          exists: true,
          existsRescan: true,
          folderLastModified: stats.mtime,
        }) // I'm intentionally not updating `lastUpdated` here (, updatedAt: new Date())
        .where(eq(dbFolder.id, newFolder.id));
    }

    if (!newFolder) {
      log('info', `📁➕ ${relativePath(path)} IS NEW, CREATING`);
      newFolder = await db
        .insert(dbFolder)
        .values({
          ...props,
          createdAt: new Date(),
          updatedAt: new Date(),
          exists: true,
          existsRescan: true,
          folderLastModified: stats.mtime,
        })
        .returning()
        .then((f) => f[0]);
    }

    folderList[p] = newFolder!.id; // for caching
    updateFolderHash(newFolder!);
    f = newFolder!.id;
    log('info', `📁➕ ${relativePath(path)}`);
  }
  // console.log('finished addFolder: ' + path);

  return f;
};
