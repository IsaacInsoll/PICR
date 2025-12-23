import { contextPermissions } from '../../auth/contextPermissions.js';
import { GraphQLID, GraphQLNonNull, GraphQLString } from 'graphql';
import { folderType } from '../types/folderType.js';
import { GraphQLError } from 'graphql/error/index.js';
import { PicrRequestContext } from '../../types/PicrRequestContext.js';
import { GraphQLFieldResolver } from 'graphql/type/index.js';
import { picrConfig } from '../../config/picrConfig.js';
import { existsSync, renameSync } from 'node:fs';
import { db } from '../../db/picrDb.js';
import { and, eq, like, sql, isNull } from 'drizzle-orm';
import { dbFile, dbFolder } from '../../db/models/index.js';
import { folderList, pathSplit } from '../../filesystem/fileManager.js';

const resolver: GraphQLFieldResolver<any, PicrRequestContext> = async (
  _,
  params,
  context: PicrRequestContext,
) => {
  const { folder } = await contextPermissions(
    context,
    params.folderId,
    'Admin',
  );

  if (!picrConfig.canWrite) {
    throw new GraphQLError('No Write Access');
  }

  const { oldPath, newPath } = params;

  if (folder.parentId == null || oldPath === '') {
    throw new GraphQLError('Cannot rename root folder');
  }

  if (folder.relativePath != oldPath) {
    throw new GraphQLError('Folder name mismatch');
  }
  if (oldPath == newPath || !newPath || newPath == '') {
    throw new GraphQLError('New name invalid');
  }
  if (newPath.startsWith(oldPath + '/')) {
    throw new GraphQLError('Cannot move a folder into its own subfolder');
  }

  const fullOld = picrConfig.mediaPath + '/' + oldPath;
  const fullNew = picrConfig.mediaPath + '/' + newPath;

  if (existsSync(fullNew)) {
    throw new GraphQLError('New folder name already exists');
  }

  const pathParts = pathSplit(newPath);
  const [shortName] = pathParts.slice(-1);
  const newParentPath = pathParts.slice(0, -1).join('/');

  console.log(`renamed [${shortName}] ${fullOld} => ${fullNew}`);

  const newParentFolder = newParentPath
    ? await db.query.dbFolder.findFirst({
        where: and(
          eq(dbFolder.relativePath, newParentPath),
          eq(dbFolder.exists, true),
        ),
      })
    : await db.query.dbFolder.findFirst({
        where: and(isNull(dbFolder.parentId), eq(dbFolder.exists, true)),
      });

  if (!newParentFolder) {
    throw new GraphQLError('New parent folder not found');
  }

  const thisFolder = await db
    .update(dbFolder)
    .set({
      name: shortName,
      parentId: newParentFolder.id,
    })
    .where(eq(dbFolder.id, folder.id));

  console.log(thisFolder);

  const folders = await db
    .update(dbFolder)
    .set({
      relativePath: sql`REGEXP_REPLACE(${dbFolder.relativePath}, ${'^' + escapeRegExp(oldPath)}, ${escapeRegExp(newPath)})`,
    })
    .where(
      and(
        like(dbFolder.relativePath, oldPath + '%'),
        eq(dbFolder.exists, true),
      ),
    );

  console.log(folders);
  console.log(
    `REGEXP_REPLACE(${dbFile.relativePath}, ${'^' + escapeRegExp(oldPath)}, ${escapeRegExp(newPath)}`,
  );

  const files = await db
    .update(dbFile)
    .set({
      relativePath: sql`REGEXP_REPLACE(${dbFile.relativePath}, ${'^' + escapeRegExp(oldPath)}, ${escapeRegExp(newPath)})`,
    })
    .where(
      and(like(dbFile.relativePath, oldPath + '%'), eq(dbFile.exists, true)),
    );

  console.log(files);

  const filesFolderIds = await db
    .update(dbFile)
    .set({
      folderId: sql`(SELECT ${dbFolder.id} FROM ${dbFolder} WHERE ${dbFolder.relativePath} = ${dbFile.relativePath} AND ${dbFolder.exists} = true LIMIT 1)`,
    })
    .where(
      and(
        like(dbFile.relativePath, newPath + '%'),
        eq(dbFile.exists, true),
      ),
    );

  console.log(filesFolderIds);

  updateFolderListPaths(oldPath, newPath);

  try {
    renameSync(fullOld, fullNew);
    console.log('Folder renamed successfully!');
  } catch (err) {
    console.error('Error renaming folder:', err);
  }

  moveCacheFolders(oldPath, newPath);

  return folder;
};

export const renameFolder = {
  type: new GraphQLNonNull(folderType),
  resolve: resolver,
  args: {
    folderId: { type: new GraphQLNonNull(GraphQLID) },
    oldPath: { type: new GraphQLNonNull(GraphQLString) },
    newPath: { type: new GraphQLNonNull(GraphQLString) },
  },
};

const moveCacheFolders = (oldPath: string, newPath: string) => {
  try {
    renameSync(
      picrConfig.cachePath + '/thumbs/' + oldPath,
      picrConfig.cachePath + '/thumbs/' + newPath,
    );
  } catch (err) {
    console.error('Error moving caches folder:', err);
  }
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
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
