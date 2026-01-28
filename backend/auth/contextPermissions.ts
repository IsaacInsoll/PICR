import {
  ContextualPermissions,
  FolderPermissions,
} from '../types/FolderPermissions.js';
import { doAuthError } from './doAuthError.js';
import { GraphQLError } from 'graphql/error/index.js';
import { folderIsUnderFolder } from '../helpers/folderIsUnderFolderId.js';
import { dbFolderForId } from '../db/picrDb.js';
import { PicrRequestContext } from '../types/PicrRequestContext.js';

type fid = number | null | undefined;

// Will return `folder` only if you have access to it.
// Will throw error if you don't have at least `requires` permissions
export async function contextPermissions(
  context: PicrRequestContext,
  folderId: fid,
  requires: FolderPermissions,
): Promise<ContextualPermissions>;
export async function contextPermissions(
  context: PicrRequestContext,
  folderId: fid,
): Promise<Partial<ContextualPermissions>>;
export async function contextPermissions(
  context: Pick<PicrRequestContext, 'user' | 'userHomeFolder'>,
  folderId: fid,
  requires?: FolderPermissions,
): Promise<Partial<ContextualPermissions>> {
  const { user, userHomeFolder } = context;
  // Check valid folderId
  if (!folderId) {
    if (requires) throw new GraphQLError('Not Found');
    return { permissions: 'None', user };
  }

  const folder = await dbFolderForId(folderId);

  if (user && user.userType == 'Admin' && folder && folder.exists) {
    if (folderIsUnderFolder(folder, userHomeFolder)) {
      return { permissions: 'Admin', user, folder };
    }
  }

  if (
    user &&
    (user.userType == 'Link' || user.userType == 'User') &&
    folder &&
    folder.exists
  ) {
    if (folderIsUnderFolder(folder, userHomeFolder)) {
      if (requires == 'Admin')
        throw new GraphQLError('No admin permissions for ' + folder.name);
      return {
        permissions: 'View',
        user: user,
        folder,
      };
    }
  }

  if (requires) {
    if (user?.userType == 'Link') {
      throw new GraphQLError('Invalid Link (UUID)');
    } else {
      if (!user) doAuthError('Not Logged In');
      doAuthError('Access Denied');
    }
  }
  return { permissions: 'None', user: undefined };
}
