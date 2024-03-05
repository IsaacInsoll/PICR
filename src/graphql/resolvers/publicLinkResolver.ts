import { contextPermissionsForFolder } from '../../auth/contextPermissionsForFolder';
import { GraphQLError } from 'graphql/error';
import { folderAndAllParentIds } from '../../helpers/folderAndAllParentIds';
import Folder from '../../models/Folder';
import PublicLink from '../../models/PublicLink';

export const publicLinkResolver = async (params, context) => {
  const permissions = await contextPermissionsForFolder(
    context,
    params.folderId,
    true,
  );
  if (permissions !== 'Admin')
    throw new GraphQLError('You must be an Admin to see this');

  const folder = await Folder.findByPk(params.folderId);

  const ids = params.includeParents
    ? [await folderAndAllParentIds(folder)]
    : folder.id;
  const data = await PublicLink.findAll({ where: { folderId: ids } });
  return data.map((pl) => pl.toJSON());
};
