import { getUserFromToken } from '../../auth/jwt-auth';
import { GraphQLError } from 'graphql/error';
import { getServerOptions } from '../../db/ServerOptionsModel';
import { clientInfoType } from '../types/clientInfoType';

const resolver = async (_, params, context, schema) => {
  const user = await getUserFromToken(context);
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
