import { contextPermissions } from '../../auth/contextPermissions.js';
import { hashFolderContents } from '../../helpers/zip.js';
import { addToZipQueue } from '../../helpers/zipQueue.js';
import { GraphQLID, GraphQLNonNull, GraphQLString } from 'graphql';
import { AccessType, User } from '../../../graphql-types.js';
import { createAccessLog } from '../../db/picrDb.js';
import { PicrRequestContext } from '../../types/PicrRequestContext.js';
import { GraphQLFieldResolver } from 'graphql/type/index.js';

const resolver: GraphQLFieldResolver<any, PicrRequestContext> = async (
  _,
  params,
  context: PicrRequestContext,
) => {
  const { user, folder } = await contextPermissions(
    context,
    params.folderId,
    'View',
  );
  await createAccessLog(user, folder, context, AccessType.Download);

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
