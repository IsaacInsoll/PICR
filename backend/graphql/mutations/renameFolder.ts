import { contextPermissions } from '../../auth/contextPermissions.js';
import { GraphQLID, GraphQLNonNull, GraphQLString } from 'graphql';
import { folderType } from '../types/folderType.js';
import { GraphQLError } from 'graphql/error/index.js';
import { PicrRequestContext } from '../../types/PicrRequestContext.js';
import { GraphQLFieldResolver } from 'graphql/type/index.js';
import { picrConfig } from '../../config/picrConfig.js';
import { existsSync, renameSync } from 'node:fs';
import { db } from '../../db/picrDb.js';
import { and, eq, like, sql } from 'drizzle-orm';
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

  if (folder.parentId == null) {
    throw new GraphQLError('Cannot rename root folder');
  }

  if (folder.relativePath != oldPath) {
    throw new GraphQLError('Folder name mismatch');
  }
  if (oldPath == newPath || !newPath || newPath == '') {
    throw new GraphQLError('New name invalid');
  }

  const fullOld = picrConfig.mediaPath + '/' + oldPath;
  const fullNew = picrConfig.mediaPath + '/' + newPath;

  if (existsSync(fullNew)) {
    throw new GraphQLError('New folder name already exists');
  }

  const [shortName] = pathSplit(newPath).slice(-1);

  console.log(`renamed [${shortName}] ${fullOld} => ${fullNew}`);

  const thisFolder = await db
    .update(dbFolder)
    .set({
      name: shortName,
    })
    .where(eq(dbFolder.id, folder.id));

  console.log(thisFolder);

  const folders = await db
    .update(dbFolder)
    .set({
      //TODO: regex this so it only replaces start of string, and not all occurrences of $oldPath
      relativePath: sql`REPLACE(${dbFolder.relativePath}, ${oldPath}, ${newPath})`,
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

  folderList[newPath] = folder.id;

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
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
