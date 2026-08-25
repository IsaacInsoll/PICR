import type {
  ContextualPermissions,
  FolderPermissions,
} from '../types/FolderPermissions.js';
import { doAuthError } from './doAuthError.js';
import { GraphQLError } from 'graphql/error/index.js';
import { folderIsUnderFolder } from '../helpers/folderIsUnderFolderId.js';
import { dbFolderForId } from '../db/picrDb.js';
import type { PicrRequestContext } from '../types/PicrRequestContext.js';

type FolderIdInput = number | null | undefined;

// Will return `folder` only if you have access to it.
// Will throw error if you don't have at least `requires` permissions
export async function contextPermissions(
  context: PicrRequestContext,
  folderId: FolderIdInput,
  requires: FolderPermissions,
): Promise<ContextualPermissions>;
export async function contextPermissions(
  context: PicrRequestContext,
  folderId: FolderIdInput,
): Promise<Partial<ContextualPermissions>>;
export async function contextPermissions(
  context: Pick<
    PicrRequestContext,
    'authentication' | 'user' | 'userHomeFolder'
  >,
  folderId: FolderIdInput,
  requires?: FolderPermissions,
): Promise<Partial<ContextualPermissions>> {
  const { user, userHomeFolder } = context;
  // Check valid folderId
  if (!folderId) {
    if (requires) throw new GraphQLError('Not Found');
    return { permissions: 'None', user };
  }

  const folder = await dbFolderForId(folderId);

  if (user?.userType === 'Admin' && folder?.exists) {
    if (folderIsUnderFolder(folder, userHomeFolder)) {
      return { permissions: 'Admin', user, folder };
    }
  }

  if (
    (user?.userType === 'Link' || user?.userType === 'User') &&
    folder?.exists
  ) {
    if (folderIsUnderFolder(folder, userHomeFolder)) {
      if (requires === 'Admin') doAuthError('ACCESS_DENIED');
      return {
        permissions: 'View',
        user: user,
        folder,
      };
    }
  }

  if (requires) {
    if (context.authentication.principal.kind === 'public_link') {
      doAuthError('INVALID_LINK');
    }
    if (context.authentication.principal.kind === 'jwt') {
      doAuthError('ACCESS_DENIED');
    }
    const linkOutcome = context.authentication.publicLinkAttempt?.outcome;
    if (
      linkOutcome?.status === 'rejected' &&
      linkOutcome.reason === 'expired'
    ) {
      doAuthError(
        'PUBLIC_LINK_EXPIRED',
        linkOutcome.user?.expiresAt?.toISOString(),
      );
    }
    if (linkOutcome) doAuthError('INVALID_LINK');
    doAuthError('NOT_LOGGED_IN');
  }
  return { permissions: 'None', user: undefined };
}
