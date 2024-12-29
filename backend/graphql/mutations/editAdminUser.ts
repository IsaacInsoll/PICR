import { contextPermissions } from '../../auth/contextPermissions';
import User from '../../models/User';
import { GraphQLError } from 'graphql/error';
import Folder from '../../models/Folder';
import { hashPassword } from '../../helpers/hashPassword';

import { getFolder } from '../helpers/getFolder';
import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLNonNull,
  GraphQLString,
} from 'graphql';
import { userType } from '../types/userType';
import { commentPermissionsEnum } from '../enums/commentPermissionsEnum';
import { Op } from 'sequelize';
import { folderIsUnderFolderId } from '../../helpers/folderIsUnderFolderId';

const resolver = async (_, params, context) => {
  const { user } = await contextPermissions(context, params.folderId, 'Admin');
  let adminUser: User | null = null;

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
    adminUser = await User.findByPk(params.id);
    if (!adminUser)
      throw new GraphQLError('No user found for ID: ' + params.id);
    const userFolder = await Folder.findByPk(adminUser.folderId);
    if (!(await folderIsUnderFolderId(userFolder, user.folderId))) {
      throw new GraphQLError(
        'You cant edit this user as they are above your level of access',
      );
    }
  } else {
    if (pass && username) {
      adminUser = new User();
    } else {
      throw new GraphQLError(
        'Cannot create new user without username and password',
      );
    }
  }
  adminUser.folderId = params.folderId;
  adminUser.name = params.name;

  adminUser.username = params.username;
  adminUser.enabled = params.enabled;
  adminUser.commentPermissions = params.commentPermissions;
  if (pass) adminUser.hashedPassword = hashPassword(pass);

  await adminUser.save();

  return { ...adminUser.toJSON(), folder: getFolder(adminUser.folderId) };
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
