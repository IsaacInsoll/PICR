import { contextPermissions } from '../../auth/contextPermissions.js';
import { folderAndAllParentIds } from '../../helpers/folderAndAllParentIds.js';
import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
} from 'graphql';
import { userType } from '../types/userType.js';
import { allSubfolders } from '../../helpers/allSubfolders.js';
import { userToJSON } from '../helpers/userToJSON.js';
import { db, dbFolderForId } from '../../db/picrDb.js';
import { and, desc, eq, inArray, isNotNull } from 'drizzle-orm';
import { dbUser } from '../../db/models/index.js';
import { PicrRequestContext } from '../../types/PicrRequestContext.js';
import { GraphQLFieldResolver } from 'graphql/type/index.js';
import { ServerInfo, User } from '../../../graphql-types.js';

const resolver: GraphQLFieldResolver<any, PicrRequestContext> = async (
  _,
  params,
  context,
) => {
  const { folder, user } = await contextPermissions(
    context,
    params.folderId,
    'Admin',
  );

  const ids = [folder.id];
  if (params.includeParents) {
    const parents = await folderAndAllParentIds(folder, user.folderId);
    ids.push(...parents);
  }

  if (params.includeChildren) {
    const children = await allSubfolders(folder.id);
    const childIds = children.map(({ id }) => id);
    ids.push(...childIds);
  }

  const where = and(inArray(dbUser.folderId, ids), eq(dbUser.userType, 'Link'));

  const data = await db.query.dbUser.findMany({
    where: !params.sortByRecent
      ? where
      : and(where, isNotNull(dbUser.lastAccess)),
    orderBy: params.sortByRecent ? [desc(dbUser.lastAccess)] : undefined,
    limit: params.sortByRecent ? 10 : 1000,
  });

  return data.map((pl) => {
    return { ...userToJSON(pl), folder: dbFolderForId(pl.folderId) };
  });
};

export const users = {
  type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(userType))),
  resolve: resolver,
  args: {
    folderId: { type: new GraphQLNonNull(GraphQLID) },
    includeParents: { type: GraphQLBoolean },
    includeChildren: { type: GraphQLBoolean },
    sortByRecent: { type: GraphQLBoolean },
  },
};
