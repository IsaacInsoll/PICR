import { contextPermissions } from '../../auth/contextPermissions';
import { GraphQLID, GraphQLNonNull, GraphQLString } from 'graphql/index';
import Branding from '../../models/Branding';
import { getFolder } from '../helpers/getFolder';
import { primaryColorEnum, themeModeEnum } from '../enums/themeModeEnum';
import { folderType } from '../types/folderType';

const resolver = async (_, params, context) => {
  await contextPermissions(context, params.folderId, 'Admin');

  const [obj] = await Branding.findOrCreate({
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
