import { clientInfoType } from '../types/clientInfoType.js';
import { getServerOptions } from '../../db/picrDb.js';
import { GraphQLFieldResolver } from 'graphql/type/index.js';
import { PicrRequestContext } from '../../types/PicrRequestContext.js';
import { picrConfig } from '../../config/picrConfig.js';
import { doAuthError } from '../../auth/doAuthError.js';

const resolver: GraphQLFieldResolver<unknown, PicrRequestContext> = async (
  _,
  _params,
  context,
) => {
  //TODO: fix this doesn't work when accessing as public user
  const user = context.user;
  if (!user) return doAuthError('NOT_LOGGED_IN');
  const opts = await getServerOptions();

  return {
    avifEnabled: opts.avifEnabled ?? false,
    canWrite: user.userType == 'Admin' && picrConfig.canWrite,
    baseUrl: picrConfig.baseUrl,
  };
};

export const clientInfo = {
  type: clientInfoType,
  resolve: resolver,
};
