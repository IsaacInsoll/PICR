import { contextPermissionsForFolder as perms } from '../../auth/contextPermissionsForFolder';
import { doAuthError } from '../../auth/doAuthError';
import User from '../../models/User';
import { GraphQLError } from 'graphql/error';
import Folder from '../../models/Folder';
import { FolderIsUnderFolderId } from '../../auth/folderUtils';
import { hashPassword } from '../../helpers/hashPassword';

import { getFolder } from '../helpers/getFolder';
import {
  GraphQLBoolean,
  GraphQLField,
  GraphQLID,
  GraphQLNonNull,
  GraphQLString,
} from 'graphql';
import { userType } from '../types/userType';
import { GraphQLFieldResolver } from 'graphql/type';
import { commentPermissionsEnum } from '../enums/commentPermissionsEnum';
import { Op } from 'sequelize';

const resolver = async (_, params, context) => {
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
      where: {
        username: username,
        uuid: { [Op.ne]: null },
      },
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
  user.commentPermissions = params.commentPermissions;
  if (pass) user.hashedPassword = hashPassword(pass);

  await user.save();

  return { ...user.toJSON(), folder: getFolder(user.folderId) };
};

export const editAdminUser = {
  type: new GraphQLNonNull(userType),
  resolve: resolver,
  args: {
    id: { type: GraphQLID },
    folderId: { type: GraphQLID },
    name: { type: GraphQLString },
    username: { type: GraphQLString },
    password: { type: GraphQLString },
    enabled: { type: GraphQLBoolean },
    commentPermissions: { type: commentPermissionsEnum },
  },
};
