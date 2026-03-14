import { GraphQLList, GraphQLNonNull, GraphQLString } from 'graphql';
import { db } from '../../db/picrDb.js';
import type { PicrResolver } from '../helpers/picrResolver.js';
import type { QueryUserDevicesArgs } from '@shared/gql/graphql.js';
import { userDeviceType } from '../types/userDeviceType.js';
import { GraphQLID } from 'graphql/index.js';
import { and, eq } from 'drizzle-orm';
import { dbUserDevice } from '../../db/models/index.js';
import { doAuthError } from '../../auth/doAuthError.js';
import { parseNumericId } from '../helpers/parseNumericId.js';

const resolver: PicrResolver<object, QueryUserDevicesArgs> = async (
  _,
  params,
  context,
) => {
  const { user, isUser } = context;
  if (!user || !isUser) {
    return doAuthError('NOT_A_USER');
  }
  const userId = parseNumericId(params.userId, 'userId');
  if (user.id !== userId) {
    return doAuthError('ACCESS_DENIED');
  }

  const filters = [eq(dbUserDevice.userId, userId)];
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
