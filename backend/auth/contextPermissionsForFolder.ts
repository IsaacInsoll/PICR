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

  const user = await getUserFromToken(context);
  const hasUUID = !!context.uuid && context.uuid !== '';
  const folder = await Folder.findByPk(folderId);

  if (folder && folder.exists) {
    if (user) {
      if (await FolderIsUnderFolderId(folder, user.folderId)) {
        return ['Admin', user];
      }
    }
    if (hasUUID) {
      const link = await User.findOne({ where: { uuid: context.uuid } });
      //todo: check expiry dates, enabled status on link
      if (link) {
        if (!link.enabled) {
          throw new GraphQLError('This link is currently unavailable');
        }
        if (await FolderIsUnderFolderId(folder, link.folderId)) {
          return ['View', await User.findByPk(link.id)];
        }
      }
    }
  }
  if (throwErrorIfNoPermission) {
    if (hasUUID) {
      throw new GraphQLError('Invalid Link (UUID)');
    } else {
      if (!user) doAuthError('Not Logged In');
      doAuthError('Access Denied');
    }
  }
  return ['None', null];
};
