import {
  ContextualPermissions,
  FolderPermissions,
} from '../types/FolderPermissions';
import { doAuthError } from './doAuthError';
import { GraphQLError } from 'graphql/error';
import { folderIsUnderFolderId } from '../helpers/folderIsUnderFolderId';
import { dbFolderForId } from '../db/picrDb';
import { PicrRequestContext } from '../types/PicrRequestContext';

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
  context: Pick<PicrRequestContext, 'user'>,
  folderId: fid,
  requires?: FolderPermissions,
): Promise<Partial<ContextualPermissions>> {
  // Check valid folderId
  if (!folderId) {
    if (requires) throw new GraphQLError('Not Found');
    return { permissions: 'None', user: undefined };
  }

  const folder = await dbFolderForId(folderId);
  const user = context.user;

  if (user && user.userType != 'Link' && folder && folder.exists) {
    if (await folderIsUnderFolderId(folder, user.folderId)) {
      return { permissions: 'Admin', user, folder };
    }
  }

  if (user && user.userType == 'Link' && folder && folder.exists) {
    if (await folderIsUnderFolderId(folder, user.folderId)) {
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
