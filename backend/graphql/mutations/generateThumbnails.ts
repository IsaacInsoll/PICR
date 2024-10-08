import { contextPermissionsForFolder as perms } from '../../auth/contextPermissionsForFolder';
import { doAuthError } from '../../auth/doAuthError';
import { AllChildFolderIds } from '../../auth/folderUtils';
import File from '../../models/File';
import { addToQueue } from '../../filesystem/fileQueue';
import Folder from '../../models/Folder';
import {
  GraphQLBoolean,
  GraphQLField,
  GraphQLID,
  GraphQLNonNull,
} from 'graphql/index';
import { GraphQLFieldResolver } from 'graphql/type';

const resolver = async (_, params, context) => {
  const [p, u] = await perms(context, params.folderId, true);
  if (p == 'None') doAuthError("You don't have permissions for this folder");
  const folder = await Folder.findByPk(params.folderId);
  // console.log(params.folderId, folder);
  const folderIds = await AllChildFolderIds(folder);
  // console.log('folderIds', folderIds);
  const where = { folderId: folderIds };
  const ids = await File.findAll({ where, attributes: ['id'] });
  // console.log(ids);
  ids?.map((id) => addToQueue('generateThumbnails', { id: id.id }));
  return true;
};

export const generateThumbnails = {
  type: new GraphQLNonNull(GraphQLBoolean),
  resolve: resolver,
  args: {
    folderId: { type: GraphQLID },
  },
};
