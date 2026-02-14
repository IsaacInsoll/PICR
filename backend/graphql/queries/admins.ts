import { contextPermissions } from '../../auth/contextPermissions.js';
import { GraphQLList, GraphQLNonNull } from 'graphql';
import { userType } from '../types/userType.js';
import { userToJSON } from '../helpers/userToJSON.js';
import { db, dbFolderForId } from '../../db/picrDb.js';
import { dbUser } from '../../db/models/index.js';
import { and, eq, ne } from 'drizzle-orm';
import { PicrRequestContext } from '../../types/PicrRequestContext.js';
import { GraphQLFieldResolver } from 'graphql/type/index.js';

const resolver: GraphQLFieldResolver<unknown, PicrRequestContext> = async (
  _,
  params,
  context,
) => {
  await requireFullAdmin(context);
  const data = await db.query.dbUser.findMany({
    where: and(ne(dbUser.userType, 'Link'), eq(dbUser.deleted, false)),
  });
  return data.map((u) => {
    return { ...userToJSON(u), folder: dbFolderForId(u.folderId) };
  });
};

export const admins = {
  type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(userType))),
  resolve: resolver,
};

export const requireFullAdmin = async (context: PicrRequestContext) => {
  //TODO: currently hard coded to folderId 1, do this a better way in future
  await contextPermissions(context, 1, 'Admin');
};
