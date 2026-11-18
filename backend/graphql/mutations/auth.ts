import { GraphQLNonNull, GraphQLString } from 'graphql';
import type { PicrResolver } from '../helpers/picrResolver.js';
import type { MutationAuthArgs } from '@shared/gql/graphql.js';
import { passwordLogin } from '../../auth/adminFactors.js';
import { AdminAuthError } from '../../auth/adminSessions.js';

// Legacy clients can sign in without 2FA; enrolled/enforced accounts must use the challenge API.
const resolver: PicrResolver<object, MutationAuthArgs> = async (
  _,
  params,
  context,
) => {
  try {
    const result = await passwordLogin(
      params.user,
      params.password,
      context.headers.ipAddress,
      'legacy_app',
    );
    return result.status === 'authenticated' ? result.accessToken : '';
  } catch (error) {
    if (error instanceof AdminAuthError) return '';
    throw error;
  }
};
export const auth = {
  type: new GraphQLNonNull(GraphQLString),
  resolve: resolver,
  args: {
    user: { type: new GraphQLNonNull(GraphQLString) },
    password: { type: new GraphQLNonNull(GraphQLString) },
  },
};
