import { CustomJwtPayload } from '../types/CustomJwtPayload';
import { getUserFromToken } from './jwt-auth';
import { FolderPermissions } from '../types/FolderPermissions';
import Folder from '../models/Folder';
import { doAuthError } from './doAuthError';
import { GraphQLError } from 'graphql/error';
import User from '../models/User';
import { FolderIsUnderFolderId } from './folderUtils';

export const contextPermissionsForFolder = async (
  context: CustomJwtPayload,
  folderId?: number,
  throwErrorIfNoPermission: boolean = false,
): Promise<[FolderPermissions, User]> => {
  if (!folderId) {
    if (throwErrorIfNoPermission) throw new GraphQLError('Not Found');
    return ['None', null];
  }

  const folder = await Folder.findByPk(folderId);
  const user = await getUserFromToken(context);

  if (user && folder && folder.exists) {
    if (await FolderIsUnderFolderId(folder, user.folderId)) {
      return ['Admin', user];
    }
  }

  const publicUser = await getUserFromUUID(context);
  if (publicUser && folder && folder.exists) {
    if (await FolderIsUnderFolderId(folder, publicUser.folderId)) {
      return ['View', await User.findByPk(publicUser.id)];
    }
  }

  if (throwErrorIfNoPermission) {
    if (publicUser) {
      throw new GraphQLError('Invalid Link (UUID)');
    } else {
      if (!user) doAuthError('Not Logged In');
      doAuthError('Access Denied');
    }
  }
  return ['None', null];
};

export const getUserFromUUID = async (
  context: CustomJwtPayload,
): Promise<User | undefined> => {
  const hasUUID = !!context.uuid && context.uuid !== '';
  if (hasUUID) {
    const user = await User.findOne({ where: { uuid: context.uuid } });
    //todo: check expiry dates etc
    if (user && user.enabled) {
      return user;
    }
  }
};
