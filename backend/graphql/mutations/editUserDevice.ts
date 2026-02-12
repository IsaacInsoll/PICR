import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLNonNull,
  GraphQLString,
} from 'graphql';
import { db } from '../../db/picrDb.js';
import { and, eq } from 'drizzle-orm';
import { dbUserDevice } from '../../db/models/index.js';
import { PicrRequestContext } from '../../types/PicrRequestContext.js';
import { GraphQLFieldResolver } from 'graphql/type/index.js';
import { userDeviceType } from '../types/userDeviceType.js';
import { doAuthError } from '../../auth/doAuthError.js';

const resolver: GraphQLFieldResolver<
  any,
  PicrRequestContext,
  { userId: number; enabled: boolean; notificationToken: string; name: string }
> = async (_, params, context) => {
  const { user, isUser } = context;
  if (!user || !isUser) {
    return doAuthError('NOT_A_USER');
  }
  if (user.id != params.userId) {
    return doAuthError('ACCESS_DENIED');
  }

  const props = {
    userId: params.userId,
    name: params.name,
    notificationToken: params.notificationToken,
    enabled: params.enabled,
    updatedAt: new Date(),
  };

  const existing = await db.query.dbUserDevice.findFirst({
    where: and(
      eq(dbUserDevice.userId, params.userId),
      eq(dbUserDevice.notificationToken, params.notificationToken),
    ),
  });

  if (existing) {
    await db
      .update(dbUserDevice)
      .set(props)
      .where(eq(dbUserDevice.id, existing.id));
  } else {
    await db.insert(dbUserDevice).values({ ...props, createdAt: new Date() });
  }

  // return await dbFolderForId(params.folderId);
  return props;
};

export const editUserDevice = {
  type: new GraphQLNonNull(userDeviceType),
  resolve: resolver,
  args: {
    userId: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: GraphQLString },
    notificationToken: { type: new GraphQLNonNull(GraphQLString) },
    enabled: { type: new GraphQLNonNull(GraphQLBoolean) },
  },
};
