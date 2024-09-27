import { contextPermissionsForFolder as perms } from '../../auth/contextPermissionsForFolder';
import { doAuthError } from '../../auth/doAuthError';
import Folder from '../../models/Folder';
import { hashFolderContents } from '../../helpers/zip';
import { addToZipQueue } from '../../helpers/zipQueue';
import {
  GraphQLField,
  GraphQLID,
  GraphQLNonNull,
  GraphQLString,
} from 'graphql/index';
import { GraphQLFieldResolver } from 'graphql/type';

const resolver = async (_, params, context) => {
  const [p, u] = await perms(context, params.folderId, true);
  if (p == 'None') doAuthError("You don't have permissions for this folder");
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
