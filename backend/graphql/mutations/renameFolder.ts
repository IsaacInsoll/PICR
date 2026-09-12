import { contextPermissions } from '../../auth/contextPermissions.js';
import { GraphQLID, GraphQLNonNull, GraphQLString } from 'graphql';
import { folderType } from '../types/folderType.js';
import { GraphQLError } from 'graphql/error/index.js';
import type { PicrResolver } from '../helpers/picrResolver.js';
import type { MutationRenameFolderArgs } from '@shared/gql/graphql.js';
import { picrConfig } from '../../config/picrConfig.js';
import { existsSync, renameSync } from 'node:fs';
import { db } from '../../db/picrDb.js';
import { and, eq, like, or, sql, isNull } from 'drizzle-orm';
import { dbFile, dbFolder } from '../../db/models/index.js';
import { folderList, pathSplit } from '../../filesystem/fileManager.js';
import { moveThumbnailFolder } from '../../media/moveThumbnailFolder.js';
import { validateRelativePath } from '@shared/validation/folderPath.js';
import { folderIsUnderFolder } from '../../helpers/folderIsUnderFolderId.js';
import { descendantPathPattern } from '../../helpers/descendantPathPattern.js';
import { doAuthError } from '../../auth/doAuthError.js';
import { log } from '../../logger.js';
import {
  folderRenameFileUpdates,
  folderRenamePathUpdate,
} from '../../filesystem/folderRenameFileUpdates.js';

const resolver: PicrResolver<object, MutationRenameFolderArgs> = async (
  _,
  params,
  context,
) => {
  const { folder } = await contextPermissions(
    context,
    params.folderId,
    'Admin',
  );

  const { oldPath, newPath } = params;

  assertWriteAccess();

  if (folder.id === 1 || folder.id === context.userHomeFolder?.id) {
    throw new GraphQLError('Cannot rename root folder');
  }
  if (folder.parentId == null || oldPath === '') {
    throw new GraphQLError('Cannot rename root folder');
  }

  const oldPathError = validateRelativePath(oldPath);
  if (oldPathError) {
    throw new GraphQLError(oldPathError);
  }
  const newPathError = validateRelativePath(newPath, { requireNonEmpty: true });
  if (newPathError) {
    throw new GraphQLError(newPathError);
  }

  if (folder.relativePath !== oldPath) {
    throw new GraphQLError('Folder name mismatch');
  }
  if (oldPath === newPath || !newPath || newPath === '') {
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

  log('info', `renaming [${shortName}] ${fullOld} => ${fullNew}`);

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
  if (!folderIsUnderFolder(newParentFolder, context.userHomeFolder)) {
    doAuthError('ACCESS_DENIED');
  }

  const conflict = await db.query.dbFolder.findFirst({
    where: and(
      eq(dbFolder.parentId, newParentFolder.id),
      eq(dbFolder.exists, true),
      eq(sql`LOWER(${dbFolder.name})`, shortName.toLowerCase()),
    ),
  });
  if (conflict && conflict.id !== folder.id) {
    throw new GraphQLError('New folder name already exists');
  }

  try {
    renameSync(fullOld, fullNew);
    log('info', 'Folder renamed successfully!');
  } catch (err) {
    const error = err as NodeJS.ErrnoException;
    log(
      'error',
      [
        `Error renaming folder ${fullOld} => ${fullNew}.`,
        `Code: ${error.code ?? 'unknown'}.`,
        `Message: ${error.message}`,
      ].join(' '),
    );
    throw new GraphQLError('Failed to rename folder');
  }

  try {
    await db.transaction(async (transaction) => {
      await transaction
        .update(dbFolder)
        .set({
          name: shortName,
          parentId: newParentFolder.id,
        })
        .where(eq(dbFolder.id, folder.id));

      await transaction
        .update(dbFolder)
        .set({
          relativePath: folderRenamePathUpdate(
            dbFolder.relativePath,
            oldPath,
            newPath,
          ),
        })
        .where(
          and(
            or(
              eq(dbFolder.relativePath, oldPath),
              like(dbFolder.relativePath, descendantPathPattern(oldPath)),
            ),
            eq(dbFolder.exists, true),
          ),
        );

      await transaction
        .update(dbFile)
        .set(folderRenameFileUpdates(oldPath, newPath))
        .where(
          and(
            or(
              eq(dbFile.relativePath, oldPath),
              like(dbFile.relativePath, descendantPathPattern(oldPath)),
            ),
            eq(dbFile.exists, true),
          ),
        );

      await transaction
        .update(dbFile)
        .set({
          folderId: sql`(SELECT ${dbFolder.id} FROM ${dbFolder} WHERE ${dbFolder.relativePath} = ${dbFile.relativePath} AND ${dbFolder.exists} = true LIMIT 1)`,
        })
        .where(
          and(
            or(
              eq(dbFile.relativePath, newPath),
              like(dbFile.relativePath, descendantPathPattern(newPath)),
            ),
            eq(dbFile.exists, true),
          ),
        );
    });
  } catch (err) {
    try {
      renameSync(fullNew, fullOld);
    } catch (rollbackErr) {
      log('error', 'Error rolling back folder rename: ' + String(rollbackErr));
    }
    throw err;
  }

  updateFolderListPaths(oldPath, newPath);

  await moveThumbnailFolder(oldPath, newPath);

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
const assertWriteAccess = () => {
  if (!picrConfig.canWrite) {
    throw new GraphQLError('No Write Access');
  }
};
