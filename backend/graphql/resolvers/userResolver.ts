import { contextPermissionsForFolder } from '../../auth/contextPermissionsForFolder';
import { GraphQLError } from 'graphql/error';
import { folderAndAllParentIds } from '../../helpers/folderAndAllParentIds';
import Folder from '../../models/Folder';
import { getFolder } from './resolverHelpers';
import { Op } from 'sequelize';
import User from '../../models/User';
import { getUserFromToken } from '../../auth/jwt-auth';

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
  // we don't show 'real users' just 'shared public users'
  const data = await User.findAll({
    where: { folderId: { [Op.or]: ids }, uuid: { [Op.not]: null } },
  });
  return data.map((pl) => {
    return { ...pl.toJSON(), folder: getFolder(pl.folderId) };
  });
};

export const adminsResolver = async (_, params, context) => {
  // TODO: not hardcode 'full admin' to 'admin on folder 1'
  const [p, u] = await contextPermissionsForFolder(context, 1, true);
  if (p !== 'Admin') throw new GraphQLError('You must be an Admin to see this');
  const data = await User.findAll({ where: { uuid: { [Op.is]: null } } });
  return data.map((pl) => {
    return { ...pl.toJSON(), folder: getFolder(pl.folderId) };
  });
};

export const meResolver = async (_, params, context) => {
  return await getUserFromToken(context);
};
