import { contextPermissions } from '../../auth/contextPermissions';
import { getFolder } from '../helpers/getFolder';
import { GraphQLList, GraphQLNonNull } from 'graphql';
import { userType } from '../types/userType';
import { userToJSON } from '../helpers/userToJSON';
import { db } from '../../db/picrDb';
import { dbUser } from '../../db/models';
import { isNull } from 'drizzle-orm';

const resolver = async (_, params, context) => {
  await requireFullAdmin(context);
  const data = await db.query.dbUser.findMany({
    where: isNull(dbUser.uuid),
  });
  return data.map((u) => {
    return { ...userToJSON(u), folder: getFolder(u.folderId) };
  });
};

export const admins = {
  type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(userType))),
  resolve: resolver,
};

export const requireFullAdmin = async (context) => {
  //TODO: currently hard coded to folderId 1, do this a better way in future
  await contextPermissions(context, 1, 'Admin');
};
