import { contextPermissions } from '../../auth/contextPermissions';
import FolderModel from '../../db/FolderModel';
import { hashFolderContents } from '../../helpers/zip';
import { addToZipQueue } from '../../helpers/zipQueue';
import { GraphQLID, GraphQLNonNull, GraphQLString } from 'graphql/index';
import { createAccessLog } from '../../db/AccessLogModel';
import { AccessType } from '../../../graphql-types';

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
