import { GraphQLNonNull } from 'graphql';
import { doAuthError } from '../../auth/doAuthError.js';
import { picrConfig } from '../../config/picrConfig.js';
import { getLatestBuild } from '../../helpers/latestBuild.js';
import type { PicrResolver } from '../helpers/picrResolver.js';
import { dashboardUpdateInfoType } from '../types/dashboardType.js';

const resolver: PicrResolver = async (_, _params, context) => {
  const version = picrConfig.version ?? '';
  const user = context.user;
  if (!user) {
    doAuthError('NOT_LOGGED_IN');
    return { version, latest: version };
  }
  if (user.userType === 'Link') doAuthError('INVALID_LINK');
  if (user.userType !== 'Admin') doAuthError('ACCESS_DENIED');

  const latest = (await getLatestBuild()) || version;
  return { version, latest };
};

export const dashboardUpdateInfo = {
  type: new GraphQLNonNull(dashboardUpdateInfoType),
  resolve: resolver,
};
