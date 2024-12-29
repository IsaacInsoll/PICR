import { contextPermissions } from '../../auth/contextPermissions';
import { doAuthError } from '../../auth/doAuthError';
import { GraphQLError } from 'graphql/error';
import { getFolder } from '../helpers/getFolder';
import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLNonNull,
  GraphQLString,
} from 'graphql/index';
import { userType } from '../types/userType';
import User from '../../models/User';
import { commentPermissionsEnum } from '../enums/commentPermissionsEnum';
import Folder from '../../models/Folder';
import { Op } from 'sequelize';
import { folderIsUnderFolderId } from '../../helpers/folderIsUnderFolderId';

const resolver = async (_, params, context) => {
  await contextPermissions(context, params.folderId, 'Admin');

  let user: User | null = null;
  if (params.id) {
    user = await User.findByPk(params.id);
    if (!user) throw new GraphQLError('No user found for ID: ' + params.id);
    const userFolder = await Folder.findByPk(user.folderId);
    const folderAllowed = await folderIsUnderFolderId(
      userFolder,
      params.folderId,
    );

    if (!folderAllowed)
      throw new GraphQLError(
        "You don't have access to edit users in folder " + userFolder.id,
      );
  } else {
    user = new User();
  }

  const existingUuid = await User.findAll({
    where: { uuid: params.uuid, [Op.not]: { id: user.id } },
  });

  if (existingUuid.length > 0) {
    throw new GraphQLError('Public Link Address already used');
  }

  user.folderId = params.folderId;
  user.name = params.name;
  user.username = params.username;
  user.uuid = params.uuid;
  user.enabled = params.enabled;
  user.commentPermissions = params.commentPermissions;
  await user.save();

  return { ...user.toJSON(), folder: getFolder(user.folderId) };
};

export const editUser = {
  type: new GraphQLNonNull(userType),
  resolve: resolver,
  args: {
    id: { type: GraphQLID },
    folderId: { type: GraphQLID },
    name: { type: GraphQLString },
    username: { type: GraphQLString },
    uuid: { type: GraphQLString },
    enabled: { type: GraphQLBoolean },
    commentPermissions: { type: commentPermissionsEnum },
  },
};
