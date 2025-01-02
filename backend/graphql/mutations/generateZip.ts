import { contextPermissions } from '../../auth/contextPermissions';
import FolderModel from '../../db/FolderModel';
import { hashFolderContents } from '../../helpers/zip';
import { addToZipQueue } from '../../helpers/zipQueue';
import { GraphQLID, GraphQLNonNull, GraphQLString } from 'graphql/index';

const resolver = async (_, params, context) => {
  await contextPermissions(context, params.folderId, 'View');

  const folder = await FolderModel.findByPk(params.folderId);
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
