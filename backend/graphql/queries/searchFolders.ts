import { contextPermissions } from '../../auth/contextPermissions.js';
import { GraphQLID, GraphQLList, GraphQLNonNull } from 'graphql';
import { GraphQLString } from 'graphql';
import { folderType } from '../types/folderType.js';
import { allSubfolderIds } from '../../helpers/allSubfolders.js';
import { and, eq, ilike, inArray } from 'drizzle-orm';
import { db } from '../../db/picrDb.js';
import { dbFile, dbFolder } from '../../db/models/index.js';
import { PicrRequestContext } from '../../types/PicrRequestContext.js';

const resolver = async (_, params, context: PicrRequestContext) => {
  const { folder } = await contextPermissions(
    context,
    params.folderId ?? 1,
    'View',
  );

  const folderIds = await allSubfolderIds(folder!);

  const lower = params.query.toLowerCase().split(' ');

  const folders = await db.query.dbFolder.findMany({
    where: and(
      inArray(dbFolder.parentId, folderIds),
      eq(dbFolder.exists, true),
      ...lower.map((l) => ilike(dbFile.name, `%${l}%`)),
    ),
    limit: 100,
  });

  return folders;
};

export const searchFolders = {
  type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(folderType))),
  resolve: resolver,
  args: {
    folderId: { type: GraphQLID },
    query: { type: new GraphQLNonNull(GraphQLString) },
  },
};
