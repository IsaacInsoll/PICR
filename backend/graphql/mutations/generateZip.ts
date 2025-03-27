import { contextPermissions } from '../../auth/contextPermissions';
import { hashFolderContents } from '../../helpers/zip';
import { addToZipQueue } from '../../helpers/zipQueue';
import { GraphQLID, GraphQLNonNull, GraphQLString } from 'graphql';
import { AccessType } from '../../../graphql-types';
import { createAccessLog } from '../../db/picrDb';

const resolver = async (_, params, context) => {
  const { user, folder } = await contextPermissions(
    context,
    params.folderId,
    'View',
  );
  await createAccessLog(user.id, folder.id, context, AccessType.Download);

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
