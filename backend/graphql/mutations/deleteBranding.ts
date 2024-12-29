import { contextPermissions } from '../../auth/contextPermissions';
import { GraphQLID, GraphQLNonNull } from 'graphql';
import Branding from '../../models/Branding';
import { getFolder } from '../helpers/getFolder';
import { folderType } from '../types/folderType';
import { GraphQLError } from 'graphql/error';

const resolver = async (_, params, context) => {
  await contextPermissions(context, params.folderId, 'Admin');

  const obj = await Branding.findOne({
    where: { folderId: params.folderId },
  });

  if (!obj) {
    throw new GraphQLError('No branding found for folder: ' + params.folderId);
  }

  await obj.destroy();
  return await getFolder(params.folderId);
};

export const deleteBranding = {
  type: new GraphQLNonNull(folderType),
  resolve: resolver,
  args: {
    folderId: { type: new GraphQLNonNull(GraphQLID) },
  },
};
