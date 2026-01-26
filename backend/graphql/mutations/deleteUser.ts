import { contextPermissions } from '../../auth/contextPermissions.js';
import { GraphQLError } from 'graphql/error/index.js';
import { GraphQLBoolean, GraphQLID, GraphQLNonNull } from 'graphql';
import { folderIsUnderFolderId } from '../../helpers/folderIsUnderFolderId.js';
import { db, dbFolderForId, dbUserForId } from '../../db/picrDb.js';
import { eq } from 'drizzle-orm';
import { dbUser } from '../../db/models/index.js';
import { PicrRequestContext } from '../../types/PicrRequestContext.js';
import { GraphQLFieldResolver } from 'graphql/type/index.js';

/**
 * Soft-deletes a user (Link or Admin).
 * - Sets `deleted = true` in the database
 * - Deleted users cannot authenticate
 * - Deleted users are hidden from all user listings
 * - Cannot delete user ID 1 (root admin)
 */
const resolver: GraphQLFieldResolver<any, PicrRequestContext> = async (
  _,
  params,
  context,
) => {
  const userToDelete = await dbUserForId(params.id);

  if (!userToDelete) {
    throw new GraphQLError('No user found for ID: ' + params.id);
  }

  // Prevent deleting root admin (user ID 1)
  if (userToDelete.id === 1) {
    throw new GraphQLError('Cannot delete the root admin user');
  }

  // Check admin has permission on the user's folder
  const userFolder = await dbFolderForId(userToDelete.folderId);
  if (!userFolder) {
    throw new GraphQLError('User has invalid folder: ' + userToDelete.folderId);
  }

  // Get the current user's context and verify they have Admin permission
  const { user: currentUser } = await contextPermissions(
    context,
    userFolder.id,
    'Admin',
  );

  // Verify the user being deleted is under the current user's access level
  const folderAllowed = await folderIsUnderFolderId(
    userFolder,
    currentUser.folderId,
  );

  if (!folderAllowed) {
    throw new GraphQLError(
      "You don't have permission to delete users in folder " + userFolder.id,
    );
  }

  // Soft delete the user
  await db
    .update(dbUser)
    .set({ deleted: true, updatedAt: new Date() })
    .where(eq(dbUser.id, userToDelete.id));

  return true;
};

export const deleteUser = {
  type: new GraphQLNonNull(GraphQLBoolean),
  resolve: resolver,
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
  },
};
