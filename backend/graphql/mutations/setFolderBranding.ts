import { contextPermissions } from '../../auth/contextPermissions.js';
import { GraphQLID, GraphQLNonNull } from 'graphql';
import { folderType } from '../types/folderType.js';
import { db, dbFolderForId } from '../../db/picrDb.js';
import { eq } from 'drizzle-orm';
import { dbFolder } from '../../db/models/index.js';
import { PicrRequestContext } from '../../types/PicrRequestContext.js';
import { GraphQLFieldResolver } from 'graphql/type/index.js';
import { GraphQLError } from 'graphql/error/index.js';

const resolver: GraphQLFieldResolver<any, PicrRequestContext> = async (
  _,
  params,
  context,
) => {
  await contextPermissions(context, params.folderId, 'Admin');

  const folder = await dbFolderForId(params.folderId);
  if (!folder) {
    throw new GraphQLError('Folder not found: ' + params.folderId);
  }

  // brandingId can be null to remove branding assignment
  const brandingId = params.brandingId ? Number(params.brandingId) : null;

  await db
    .update(dbFolder)
    .set({ brandingId, updatedAt: new Date() })
    .where(eq(dbFolder.id, params.folderId));

  return dbFolderForId(params.folderId);
};

export const setFolderBranding = {
  type: new GraphQLNonNull(folderType),
  resolve: resolver,
  args: {
    folderId: { type: new GraphQLNonNull(GraphQLID) },
    brandingId: { type: GraphQLID },
  },
};
