import { contextPermissionsForFolder } from '../../auth/contextPermissionsForFolder';
import { GraphQLError } from 'graphql/error';
import { folderAndAllParentIds } from '../../helpers/folderAndAllParentIds';
import Folder from '../../models/Folder';
import PublicLink from '../../models/PublicLink';
import { getFolder } from './resolverHelpers';
import { Op } from 'sequelize';

export const publicLinkResolver = async (params, context) => {
  const link = await PublicLink.findByPk(params.id);
  if (!link) throw new GraphQLError('Could not find link ' + params.id);
  const p = await contextPermissionsForFolder(context, link.folderId, true);
  if (p !== 'Admin') throw new GraphQLError('You must be an Admin to see this');
  return { ...link.toJSON(), folder: getFolder(link.folderId) };
};

export const publicLinksResolver = async (params, context) => {
  const p = await contextPermissionsForFolder(context, params.folderId, true);
  if (p !== 'Admin') throw new GraphQLError('You must be an Admin to see this');

  const folder = await Folder.findByPk(params.folderId);

  const ids = params.includeParents
    ? [await folderAndAllParentIds(folder)]
    : folder.id;
  const data = await PublicLink.findAll({
    where: { folderId: { [Op.or]: ids } },
  });
  return data.map((pl) => {
    return { ...pl.toJSON(), folder: getFolder(pl.folderId) };
  });
};
