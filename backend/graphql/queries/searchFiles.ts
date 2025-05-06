import { contextPermissions } from '../../auth/contextPermissions.js';
import { GraphQLID, GraphQLList, GraphQLNonNull, GraphQLString } from 'graphql';
import { fileType } from '../types/fileType.js';
import { allSubfolderIds, allSubfolders } from '../../helpers/allSubfolders.js';
import { and, asc, eq, ilike, inArray } from 'drizzle-orm';
import { dbFile } from '../../db/models/index.js';
import { db } from '../../db/picrDb.js';
import { PicrRequestContext } from '../../types/PicrRequestContext.js';
import { GraphQLFieldResolver } from 'graphql/type/index.js';

const resolver: GraphQLFieldResolver<any, PicrRequestContext> = async (
  _,
  params,
  context,
) => {
  const { folder } = await contextPermissions(
    context,
    params.folderId ?? 1,
    'View',
  );
  const f = folder!;
  const folderIds = await allSubfolderIds(f);

  const lower: string[] = params.query.toLowerCase().split(' ');

  const where = and(
    inArray(dbFile.folderId, folderIds),
    eq(dbFile.exists, true),
    ...lower.map((l) => ilike(dbFile.name, `%${l}%`)),
  );

  const files = await db.query.dbFile.findMany({
    where: where,
    limit: 100,
    orderBy: asc(dbFile.name),
  });

  const folders = await allSubfolders(f.id);
  return files.map((file) => {
    return {
      ...file,
      folder: folders.find(({ id }) => id == file.folderId),
    };
  });
};

export const searchFiles = {
  type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(fileType))),
  resolve: resolver,
  args: {
    folderId: { type: GraphQLID },
    query: { type: new GraphQLNonNull(GraphQLString) },
  },
};
