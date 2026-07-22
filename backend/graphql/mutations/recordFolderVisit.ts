import { contextPermissions } from '../../auth/contextPermissions.js';
import { picrConfig } from '../../config/picrConfig.js';
import { updateUserLastAccess } from '../../db/picrDb.js';
import { sendFolderViewedNotification } from '../../notifications/notifications.js';
import { AccessType } from '@shared/gql/graphql.js';
import { realVisitThresholdMs } from '@shared/realVisit.js';
import { GraphQLBoolean, GraphQLID, GraphQLNonNull } from 'graphql';
import type { PicrResolver } from '../helpers/picrResolver.js';

type MutationRecordFolderVisitArgs = {
  folderId: string;
};

const resolver: PicrResolver<object, MutationRecordFolderVisitArgs> = async (
  _,
  params,
  context,
) => {
  if (picrConfig.disableAccessLogs) return false;

  const { user, folder } = await contextPermissions(
    context,
    params.folderId,
    'View',
  );

  if (user.userType !== 'Link') return false;

  const now = Date.now();
  const lastAccess = user.lastAccess;
  const isNewVisit =
    !lastAccess || now - lastAccess.getTime() >= realVisitThresholdMs;

  if (!isNewVisit) return false;

  await updateUserLastAccess(user.id);
  await sendFolderViewedNotification(folder, user, AccessType.View);

  return true;
};

export const recordFolderVisit = {
  type: new GraphQLNonNull(GraphQLBoolean),
  resolve: resolver,
  args: {
    folderId: { type: new GraphQLNonNull(GraphQLID) },
  },
};
