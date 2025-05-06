import { getUserFromToken } from '../../auth/jwt-auth.js';
import { GraphQLError } from 'graphql/error/index.js';
import { clientInfoType } from '../types/clientInfoType.js';
import { getServerOptions } from '../../db/picrDb.js';
import { GraphQLFieldResolver } from 'graphql/type/index.js';
import { PicrRequestContext } from '../../types/PicrRequestContext.js';

const resolver: GraphQLFieldResolver<any, PicrRequestContext> = async (
  _,
  params,
  context,
) => {
  //TODO: fix this doesn't work when accessing as public user
  const user = context.user;
  if (!user) throw new GraphQLError('No permissions');
  const opts = await getServerOptions();

  return {
    avifEnabled: opts.avifEnabled ?? false,
  };
};

export const clientInfo = {
  type: clientInfoType,
  resolve: resolver,
};
