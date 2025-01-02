import { contextPermissions } from '../../auth/contextPermissions';
import { doAuthError } from '../../auth/doAuthError';
import FileModel from '../../db/FileModel';
import { GraphQLID, GraphQLNonNull } from 'graphql/index';
import { folderType } from '../types/folderType';

const resolver = async (_, params, context) => {
  const { folder } = await contextPermissions(
    context,
    params.folderId,
    'Admin',
  );

  const heroImage = await FileModel.findByPk(params.heroImageId);
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
