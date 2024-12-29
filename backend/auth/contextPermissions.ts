import { CustomJwtPayload } from '../types/CustomJwtPayload';
import { getUserFromToken } from './jwt-auth';
import {
  ContextualPermissions,
  FolderPermissions,
} from '../types/FolderPermissions';
import Folder from '../models/Folder';
import { doAuthError } from './doAuthError';
import { GraphQLError } from 'graphql/error';
import User from '../models/User';
import { FolderIsUnderFolderId } from './folderUtils';
import { getUserFromUUID } from './getUserFromUUID';

// Will return `folder` only if you have access to it.
// Will throw error if you don't have at least `requires` permissions
export const contextPermissions = async (
  context: CustomJwtPayload,
  folderId?: number,
  requires?: FolderPermissions,
): Promise<ContextualPermissions> => {
  // Check valid folderId
  if (!folderId) {
    if (requires) throw new GraphQLError('Not Found');
    return { permissions: 'None', user: null };
  }

  const folder = await Folder.findByPk(folderId);
  const user = await getUserFromToken(context);

  if (user && folder && folder.exists) {
    if (await FolderIsUnderFolderId(folder, user.folderId)) {
      return { permissions: 'Admin', user, folder };
    }
  }

  const publicUser = await getUserFromUUID(context);
  if (publicUser && folder && folder.exists) {
    if (await FolderIsUnderFolderId(folder, publicUser.folderId)) {
      if (requires == 'Admin')
        throw new GraphQLError('No admin permissions for ' + folder.name);
      return {
        permissions: 'View',
        user: await User.findByPk(publicUser.id),
        folder,
      };
    }
  }

  if (requires) {
    if (publicUser) {
      throw new GraphQLError('Invalid Link (UUID)');
    } else {
      if (!user) doAuthError('Not Logged In');
      doAuthError('Access Denied');
    }
  }
  return { permissions: 'None', user: null };
};
