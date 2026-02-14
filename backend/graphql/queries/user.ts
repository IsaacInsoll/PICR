import { contextPermissions } from '../../auth/contextPermissions.js';
import { GraphQLError } from 'graphql/error/index.js';
import { GraphQLID, GraphQLNonNull } from 'graphql';
import { userType } from '../types/userType.js';
import { userToJSON } from '../helpers/userToJSON.js';
import { db } from '../../db/picrDb.js';
import { dbUser } from '../../db/models/index.js';
import { eq } from 'drizzle-orm';
import { PicrRequestContext } from '../../types/PicrRequestContext.js';
import { GraphQLFieldResolver } from 'graphql/type/index.js';

const resolver: GraphQLFieldResolver<unknown, PicrRequestContext> = async (
  _,
  params,
  context,
) => {
  const user = await db.query.dbUser.findFirst({
    where: eq(dbUser.id, params.id),
  });
  if (!user) throw new GraphQLError('Could not find user ' + params.id);
  const { folder } = await contextPermissions(context, user.folderId, 'Admin');
  return { ...userToJSON(user), folder };
};

export const user = {
  type: new GraphQLNonNull(userType),
  resolve: resolver,
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
  },
};
