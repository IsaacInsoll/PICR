import { CustomJwtPayload } from '../types/CustomJwtPayload';
import { getUserFromToken } from './jwt-auth';
import {
  ContextualPermissions,
  FolderPermissions,
} from '../types/FolderPermissions';
import { doAuthError } from './doAuthError';
import { GraphQLError } from 'graphql/error';
import { getUserFromUUID } from './getUserFromUUID';
import { folderIsUnderFolderId } from '../helpers/folderIsUnderFolderId';
import { dbFolderForId, dbUserForId } from '../db/picrDb';

type fid = number | null | undefined;

// Will return `folder` only if you have access to it.
// Will throw error if you don't have at least `requires` permissions
export async function contextPermissions(
  context: CustomJwtPayload,
  folderId: fid,
  requires: FolderPermissions,
): Promise<ContextualPermissions>;
export async function contextPermissions(
  context: CustomJwtPayload,
  folderId: fid,
): Promise<Partial<ContextualPermissions>>;
export async function contextPermissions(
  context: CustomJwtPayload,
  folderId: fid,
  requires?: FolderPermissions,
): Promise<Partial<ContextualPermissions>> {
  // Check valid folderId
  if (!folderId) {
    if (requires) throw new GraphQLError('Not Found');
    return { permissions: 'None', user: undefined };
  }

  const folder = await dbFolderForId(folderId);
  const user = await getUserFromToken(context);

  if (user && folder && folder.exists) {
    if (await folderIsUnderFolderId(folder, user.folderId)) {
      return { permissions: 'Admin', user, folder };
    }
  }

  const publicUser = await getUserFromUUID(context);
  if (publicUser && folder && folder.exists) {
    if (await folderIsUnderFolderId(folder, publicUser.folderId)) {
      if (requires == 'Admin')
        throw new GraphQLError('No admin permissions for ' + folder.name);
      return {
        permissions: 'View',
        user: (await dbUserForId(publicUser.id))!,
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
  return { permissions: 'None', user: undefined };
}
