import { contextPermissions } from '../../auth/contextPermissions';
import Folder from '../../models/Folder';
import { hashFolderContents } from '../../helpers/zip';
import { addToZipQueue } from '../../helpers/zipQueue';
import { GraphQLID, GraphQLNonNull, GraphQLString } from 'graphql/index';

const resolver = async (_, params, context) => {
  await contextPermissions(context, params.folderId, 'View');

  const folder = await Folder.findByPk(params.folderId);
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
