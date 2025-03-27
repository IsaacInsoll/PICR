import { contextPermissions } from '../../auth/contextPermissions';
import { GraphQLError } from 'graphql/error';
import { GraphQLID, GraphQLNonNull } from 'graphql';
import { userType } from '../types/userType';
import { userToJSON } from '../helpers/userToJSON';
import { db } from '../../db/picrDb';
import { dbUser } from '../../db/models';
import { eq } from 'drizzle-orm';

const resolver = async (_, params, context) => {
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
