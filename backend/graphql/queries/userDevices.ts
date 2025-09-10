import { requireFullAdmin } from './admins.js';
import { brandingType } from '../types/brandingType.js';
import { GraphQLList, GraphQLNonNull } from 'graphql';
import { addFolderRelationship } from '../helpers/addFolderRelationship.js';
import { db } from '../../db/picrDb.js';
import { PicrRequestContext } from '../../types/PicrRequestContext.js';
import { GraphQLFieldResolver } from 'graphql/type/index.js';
import { GraphQLError } from 'graphql/error/index.js';
import { userDeviceType } from '../types/userDeviceType.js';
import { GraphQLBoolean, GraphQLID } from 'graphql/index.js';
import { userTypeEnum } from '../types/enums.js';
import { eq } from 'drizzle-orm';
import { dbFolder, dbUserDevice } from '../../db/models/index.js';

const resolver: GraphQLFieldResolver<
  any,
  PicrRequestContext,
  { userId: number }
> = async (_, params, context) => {
  const { user, isUser } = context;
  if (!user || !isUser) {
    throw new GraphQLError('Not a user');
  }
  if (user.id != params.userId) {
    throw new GraphQLError('Unable to view other user devices');
  }
  const list = await db.query.dbUserDevice.findMany({
    where: eq(dbUserDevice.userId, params.userId),
  });
  return list;
};

export const userDevices = {
  type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(userDeviceType))),
  resolve: resolver,
  args: {
    userId: { type: GraphQLID },
  },
};
