import { contextPermissionsForFolder } from '../../auth/contextPermissionsForFolder';
import { GraphQLError } from 'graphql/error';
import { folderAndAllParentIds } from '../../helpers/folderAndAllParentIds';
import Folder from '../../models/Folder';
import { getFolder } from './resolverHelpers';
import { Op } from 'sequelize';
import User from '../../models/User';

export const userResolver = async (_, params, context) => {
  const user = await User.findByPk(params.id);
  if (!user) throw new GraphQLError('Could not find user ' + params.id);
  const [p, u] = await contextPermissionsForFolder(
    context,
    user.folderId,
    true,
  );
  if (p !== 'Admin') throw new GraphQLError('You must be an Admin to see this');
  return { ...user.toJSON(), folder: getFolder(user.folderId) };
};

export const usersResolver = async (_, params, context) => {
  const [p, u] = await contextPermissionsForFolder(
    context,
    params.folderId,
    true,
  );
  if (p !== 'Admin') throw new GraphQLError('You must be an Admin to see this');

  const folder = await Folder.findByPk(params.folderId);

  const ids = params.includeParents
    ? [await folderAndAllParentIds(folder)]
    : folder.id;
  const data = await User.findAll({
    where: { folderId: { [Op.or]: ids } },
  });
  return data.map((pl) => {
    return { ...pl.toJSON(), folder: getFolder(pl.folderId) };
  });
};
