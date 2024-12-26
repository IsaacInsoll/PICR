import { contextPermissionsForFolder as perms } from '../../auth/contextPermissionsForFolder';
import { doAuthError } from '../../auth/doAuthError';
import { GraphQLID, GraphQLNonNull, GraphQLString } from 'graphql/index';
import { brandingType } from '../types/brandingType';
import Branding from '../../models/Branding';
import { getFolder } from '../helpers/getFolder';
import { primaryColorEnum, themeModeEnum } from '../enums/themeModeEnum';
import { folderType } from '../types/folderType';
import { GraphQLError } from 'graphql/error';

const resolver = async (_, params, context) => {
  const [p, u] = await perms(context, params.folderId, true);
  if (p != 'Admin') doAuthError("You don't have permissions for this folder");

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
