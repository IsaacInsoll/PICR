import { AccessType, LinkMode } from '@shared/gql/graphql.js';
import { GraphQLError } from 'graphql';
import { contextPermissions } from '../auth/contextPermissions.js';
import {
  createAccessLog,
  updateUserLastAccess,
  type FolderFields,
  type UserFields,
} from '../db/picrDb.js';
import { sendFolderViewedNotification } from '../notifications/notifications.js';
import type { PicrRequestContext } from '../types/PicrRequestContext.js';

export const assertUserCanDownload = (user: UserFields) => {
  if (user.userType === 'Link' && user.linkMode === LinkMode.ProofNoDownloads) {
    throw new GraphQLError('Downloads are disabled for this link');
  }
};

export const recordAuthorizedFolderDownload = async (
  context: PicrRequestContext,
  user: UserFields,
  folder: FolderFields,
) => {
  assertUserCanDownload(user);
  const logged = await createAccessLog(
    user,
    folder,
    context,
    AccessType.Download,
  );
  if (logged) {
    await updateUserLastAccess(user.id);
    await sendFolderViewedNotification(folder, user, AccessType.Download);
  }
};

export const recordFolderDownload = async (
  context: PicrRequestContext,
  folderId: number | null | undefined,
) => {
  const { user, folder } = await contextPermissions(context, folderId, 'View');
  await recordAuthorizedFolderDownload(context, user, folder);
  return { user, folder };
};
