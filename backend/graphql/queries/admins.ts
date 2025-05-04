import { contextPermissions } from '../../auth/contextPermissions';
import { GraphQLList, GraphQLNonNull } from 'graphql';
import { userType } from '../types/userType';
import { userToJSON } from '../helpers/userToJSON';
import { db, dbFolderForId } from '../../db/picrDb';
import { dbUser } from '../../db/models';
import { ne } from 'drizzle-orm';
import { PicrRequestContext } from '../../types/PicrRequestContext';

const resolver = async (_, params, context: PicrRequestContext) => {
  await requireFullAdmin(context);
  const data = await db.query.dbUser.findMany({
    where: ne(dbUser.userType, 'Link'),
  });
  return data.map((u) => {
    return { ...userToJSON(u), folder: dbFolderForId(u.folderId) };
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
