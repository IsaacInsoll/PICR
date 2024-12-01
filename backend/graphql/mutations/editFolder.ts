import { contextPermissionsForFolder as perms } from '../../auth/contextPermissionsForFolder';
import { doAuthError } from '../../auth/doAuthError';
import Folder from '../../models/Folder';
import File from '../../models/File';
import { GraphQLID, GraphQLNonNull } from 'graphql/index';
import { folderType } from '../types/folderType';

const resolver = async (_, params, context) => {
  const [p, u] = await perms(context, params.folderId, true);
  if (p != 'Admin') doAuthError("You don't have permissions for this folder");
  const folder = await Folder.findByPk(params.folderId);
  const heroImage = await File.findByPk(params.heroImageId);
  if (!heroImage) doAuthError('Invalid hero image ID');
  if (heroImage.type != 'Image') doAuthError('Not an image');
  if (heroImage.folderId != folder.id) doAuthError('Not in this folder');

  folder.heroImageId = heroImage.id;
  await folder.save();
  return { ...folder.toJSON(), heroImage };
};

export const editFolder = {
  type: new GraphQLNonNull(folderType),
  resolve: resolver,
  args: {
    folderId: { type: new GraphQLNonNull(GraphQLID) },
    heroImageId: { type: GraphQLID },
  },
};
