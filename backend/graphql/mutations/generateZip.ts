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
import { log } from '../../logger.js';

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
  const started = Date.now();
  let stage = 'recording download activity';
  log('info', `ZIP request for folder ${folder.id}: ${stage}`);
  try {
    const logged = await createAccessLog(
      user,
      folder,
      context,
      AccessType.Download,
    );
    if (logged) {
      await updateUserLastAccess(user.id);
      stage = 'sending download notifications';
      log('info', `ZIP request for folder ${folder.id}: ${stage}`);
      await sendFolderViewedNotification(folder, user, AccessType.Download);
    }

    stage = 'hashing folder contents';
    log('info', `ZIP request for folder ${folder.id}: ${stage}`);
    const h = await hashFolderContents(folder);
    stage = 'queueing generation';
    addToZipQueue(h);
    log(
      'info',
      `ZIP request accepted for folder ${folder.id} (${h.hash}) in ${Date.now() - started}ms`,
    );
    return h.hash;
  } catch (error) {
    log(
      'error',
      `ZIP request failed for folder ${folder.id} while ${stage}: ${String(error)}`,
    );
    throw error;
  }
};

export const generateZip = {
  type: new GraphQLNonNull(GraphQLString),
  resolve: resolver,
  args: {
    folderId: { type: GraphQLID },
  },
};
