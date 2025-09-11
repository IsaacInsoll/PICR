import { GraphQLList, GraphQLNonNull, GraphQLString } from 'graphql';
import { db } from '../../db/picrDb.js';
import { PicrRequestContext } from '../../types/PicrRequestContext.js';
import { GraphQLFieldResolver } from 'graphql/type/index.js';
import { GraphQLError } from 'graphql/error/index.js';
import { userDeviceType } from '../types/userDeviceType.js';
import { GraphQLID } from 'graphql/index.js';
import { and, eq } from 'drizzle-orm';
import { dbUserDevice } from '../../db/models/index.js';

const resolver: GraphQLFieldResolver<
  any,
  PicrRequestContext,
  { userId: number; notificationToken?: string }
> = async (_, params, context) => {
  const { user, isUser } = context;
  if (!user || !isUser) {
    throw new GraphQLError('Not a user');
  }
  if (user.id != params.userId) {
    throw new GraphQLError('Unable to view other user devices');
  }

  const filters = [eq(dbUserDevice.userId, params.userId)];
  if (params.notificationToken) {
    filters.push(eq(dbUserDevice.notificationToken, params.notificationToken));
  }

  return db.query.dbUserDevice.findMany({
    where: and(...filters),
  });
};

export const userDevices = {
  type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(userDeviceType))),
  resolve: resolver,
  args: {
    userId: { type: GraphQLID },
    notificationToken: { type: GraphQLString },
  },
};
