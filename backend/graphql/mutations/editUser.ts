import { contextPermissions } from '../../auth/contextPermissions';
import { GraphQLError } from 'graphql/error';
import { getFolder } from '../helpers/getFolder';
import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLNonNull,
  GraphQLString,
} from 'graphql/index';
import { userType } from '../types/userType';
import UserModel from '../../db/UserModel';
import { commentPermissionsEnum } from '../enums/commentPermissionsEnum';
import FolderModel from '../../db/FolderModel';
import { Op } from 'sequelize';
import { folderIsUnderFolderId } from '../../helpers/folderIsUnderFolderId';
import { badChars } from '../helpers/badChars';

const resolver = async (_, params, context) => {
  await contextPermissions(context, params.folderId, 'Admin');

  let user: UserModel | null = null;
  if (params.id) {
    user = await UserModel.findByPk(params.id);
    if (!user) throw new GraphQLError('No user found for ID: ' + params.id);
    const userFolder = await FolderModel.findByPk(user.folderId);
    const folderAllowed = await folderIsUnderFolderId(
      userFolder,
      params.folderId,
    );

    if (!folderAllowed)
      throw new GraphQLError(
        "You don't have access to edit users in folder " + userFolder.id,
      );
  } else {
    user = new UserModel();
  }

  const existingUuid = await UserModel.findAll({
    where: { uuid: params.uuid, [Op.not]: { id: user.id } },
  });

  if (existingUuid.length > 0) {
    throw new GraphQLError('Public Link Address already used');
  }

  if (!params.uuid || params.uuid.length < 6) {
    throw new GraphQLError('Public Link Address must be at least 6 characters');
  }

  if (badChars(params.uuid).length > 0) {
    throw new GraphQLError(
      "Public Link Address can't contain these characters: " +
        badChars(params.uuid).join(', '),
    );
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
