import { contextPermissions } from '../../auth/contextPermissions';
import { GraphQLID, GraphQLList, GraphQLNonNull } from 'graphql/index';
import { GraphQLString } from 'graphql';
import { fileType } from '../types/fileType';
import { allSubfolderIds, allSubfolders } from '../../helpers/allSubfolders';
import { and, asc, eq, ilike, inArray } from 'drizzle-orm';
import { dbFile } from '../../db/models';
import { db, dbFolderForId } from '../../db/picrDb';

const resolver = async (_, params, context) => {
  const { folder } = await contextPermissions(
    context,
    params.folderId ?? 1,
    'View',
  );
  const f = folder!;
  const folderIds = await allSubfolderIds(f);

  const lower = params.query.toLowerCase().split(' ');

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
