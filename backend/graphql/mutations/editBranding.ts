import { contextPermissionsForFolder as perms } from '../../auth/contextPermissionsForFolder';
import { doAuthError } from '../../auth/doAuthError';
import { GraphQLID, GraphQLNonNull, GraphQLString } from 'graphql/index';
import { brandingType } from '../types/brandingType';
import Branding from '../../models/Branding';
import { getFolder } from '../helpers/getFolder';
import { primaryColorEnum, themeModeEnum } from '../enums/themeModeEnum';
import { folderType } from '../types/folderType';

const resolver = async (_, params, context) => {
  const [p, u] = await perms(context, params.folderId, true);
  if (p != 'Admin') doAuthError("You don't have permissions for this folder");

  const [obj, isNew] = await Branding.findOrCreate({
    where: { folderId: params.folderId },
  });

  obj.mode = params.mode;
  obj.primaryColor = params.primaryColor;
  await obj.save();

  return await getFolder(params.folderId);
};

export const editBranding = {
  type: new GraphQLNonNull(folderType),
  resolve: resolver,
  args: {
    folderId: { type: new GraphQLNonNull(GraphQLID) },
    mode: { type: themeModeEnum },
    primaryColor: { type: primaryColorEnum },
    logoUrl: { type: GraphQLString },
  },
};
