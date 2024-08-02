import { contextPermissionsForFolder as perms } from '../../auth/contextPermissionsForFolder';
import { doAuthError } from '../../auth/doAuthError';
import User from '../../models/User';
import { getFolder } from '../resolvers/resolverHelpers';
import { GraphQLError } from 'graphql/error';
import { hashPassword } from '../../helpers/hashPassword';
import { FolderIsUnderFolderId } from '../../auth/folderUtils';
import Folder from '../../models/Folder';
import { Op } from 'sequelize';

export const editUser = async (_, params, context) => {
  const [p, u] = await perms(context, params.folderId, true);
  if (p !== 'Admin') doAuthError("You don't have permissions for this folder");
  let user: User | null = null;
  if (params.id) {
    user = await User.findByPk(params.id);
    if (!user) throw new GraphQLError('No user found for ID: ' + params.id);
  } else {
    user = new User();
  }
  user.folderId = params.folderId;
  user.name = params.name;
  user.uuid = params.uuid;
  user.enabled = params.enabled;

  await user.save();

  return { ...user.toJSON(), folder: getFolder(user.folderId) };
};
export const editAdminUser = async (_, params, context) => {
  const [p, u] = await perms(context, params.folderId, true);
  if (p !== 'Admin') doAuthError("You don't have permissions for this folder");
  let user: User | null = null;

  const pass = params.password;
  const username = params.username;
  if (pass && pass.length < 8) {
    throw new GraphQLError('Password must be at least 8 characters long');
  }

  if (username) {
    const existingUsername = await User.findOne({
      where: { username: username },
    });
    if (existingUsername) {
      if (existingUsername.id != params.id || !params.id) {
        throw new GraphQLError(`Username "${username} already exists`);
      }
    }
  }

  if (params.id) {
    user = await User.findByPk(params.id);
    if (!user) throw new GraphQLError('No user found for ID: ' + params.id);
    const userFolder = await Folder.findByPk(user.folderId);
    if (!(await FolderIsUnderFolderId(userFolder, u.folderId))) {
      throw new GraphQLError(
        'You cant edit this user as they are above your level of access',
      );
    }
  } else {
    if (pass && username) {
      user = new User();
    } else {
      throw new GraphQLError(
        'Cannot create new user without username and password',
      );
    }
  }
  user.folderId = params.folderId;
  user.name = params.name;

  user.username = params.username;
  user.enabled = params.enabled;
  if (pass) user.hashedPassword = hashPassword(pass);

  await user.save();

  return { ...user.toJSON(), folder: getFolder(user.folderId) };
};
