import { GraphQLBoolean, GraphQLID, GraphQLInt, GraphQLNonNull } from 'graphql';
import { and, asc, count, eq, inArray } from 'drizzle-orm';
import { GraphQLFieldResolver } from 'graphql/type/index.js';
import { folderFilesResultType } from '../types/folderFilesResultType.js';
import { contextPermissions } from '../../auth/contextPermissions.js';
import { allSubfolderIds } from '../../helpers/allSubfolders.js';
import { db, FolderFields } from '../../db/picrDb.js';
import { dbFile } from '../../db/models/index.js';
import { PicrRequestContext } from '../../types/PicrRequestContext.js';

const MAX_FOLDER_FILES = 10000;

type FileWithPath = {
  relativePath: string;
  name: string;
};

const relativeFilePath = (file: FileWithPath, basePath?: string | null) => {
  const base = basePath ?? '';
  const fileDir = file.relativePath ?? '';
  let relativeDir = fileDir;
  if (base && fileDir === base) {
    relativeDir = '';
  } else if (base && fileDir.startsWith(base + '/')) {
    relativeDir = fileDir.slice(base.length + 1);
  }
  relativeDir = relativeDir.replace(/^\/+/, '');
  return relativeDir ? `${relativeDir}/${file.name}` : file.name;
};

const resolver: GraphQLFieldResolver<unknown, PicrRequestContext> = async (
  _,
  params,
  context,
) => {
  const { folder } = await contextPermissions(
    context,
    params.folderId ?? 1,
    'View',
  );
  const baseFolder = folder as FolderFields;
  const includeSubfolders = !!params.includeSubfolders;
  const requestedLimit = params.limit ?? MAX_FOLDER_FILES;
  const limit = Math.min(requestedLimit, MAX_FOLDER_FILES);

  const folderIds = includeSubfolders
    ? await allSubfolderIds(baseFolder)
    : [baseFolder.id];

  const where = and(
    inArray(dbFile.folderId, folderIds),
    eq(dbFile.exists, true),
  );

  const totals = await db.select({ count: count() }).from(dbFile).where(where);
  const totalAvailable = totals[0]?.count ?? 0;

  const files = await db.query.dbFile.findMany({
    where,
    orderBy: asc(dbFile.name),
    limit,
  });

  const filesWithRelativePath = files.map((file) => ({
    file,
    relativePath: relativeFilePath(file, baseFolder.relativePath),
  }));

  return {
    files: filesWithRelativePath,
    totalAvailable,
    totalReturned: filesWithRelativePath.length,
    truncated: filesWithRelativePath.length < totalAvailable,
  };
};

export const folderFiles = {
  type: new GraphQLNonNull(folderFilesResultType),
  resolve: resolver,
  args: {
    folderId: { type: new GraphQLNonNull(GraphQLID) },
    includeSubfolders: { type: GraphQLBoolean },
    limit: { type: GraphQLInt },
  },
};
