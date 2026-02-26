import { contextPermissions } from '../../auth/contextPermissions.js';
import { GraphQLError } from 'graphql/error/index.js';
import { GraphQLID, GraphQLNonNull } from 'graphql';
import { userType } from '../types/userType.js';
import { userToJSON } from '../helpers/userToJSON.js';
import { db } from '../../db/picrDb.js';
import { dbUser } from '../../db/models/index.js';
import { eq } from 'drizzle-orm';
import type { PicrResolver } from '../helpers/picrResolver.js';
import type { QueryUserArgs } from '@shared/gql/graphql.js';

const resolver: PicrResolver<object, QueryUserArgs> = async (
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
