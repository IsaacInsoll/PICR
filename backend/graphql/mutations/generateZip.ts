import { contextPermissions } from '../../auth/contextPermissions.js';
import { hashFolderContents } from '../../helpers/zip.js';
import { addToZipQueue } from '../../helpers/zipQueue.js';
import { GraphQLID, GraphQLNonNull, GraphQLString } from 'graphql';
import { AccessType, LinkMode } from '@shared/gql/graphql.js';
import { createAccessLog, updateUserLastAccess } from '../../db/picrDb.js';
import type { PicrResolver } from '../helpers/picrResolver.js';
import type { MutationGenerateZipArgs } from '@shared/gql/graphql.js';
import { GraphQLError } from 'graphql/error/index.js';
import { sendFolderViewedNotification } from '../../notifications/notifications.js';

const resolver: PicrResolver<object, MutationGenerateZipArgs> = async (
  _,
  params,
  context,
) => {
  const { user, folder } = await contextPermissions(
    context,
    params.folderId,
    'View',
  );
  if (user.userType === 'Link' && user.linkMode === LinkMode.ProofNoDownloads) {
    throw new GraphQLError('Downloads are disabled for this link');
  }
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

  const h = await hashFolderContents(folder);
  addToZipQueue(h);
  return h.hash;
};

export const generateZip = {
  type: new GraphQLNonNull(GraphQLString),
  resolve: resolver,
  args: {
    folderId: { type: GraphQLID },
  },
};
