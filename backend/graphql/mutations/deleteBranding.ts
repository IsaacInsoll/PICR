import { contextPermissions } from '../../auth/contextPermissions.js';
import { GraphQLID, GraphQLNonNull } from 'graphql';
import { folderType } from '../types/folderType.js';
import { GraphQLError } from 'graphql/error/index.js';
import { brandingForFolderId, db, dbFolderForId } from '../../db/picrDb.js';
import { dbBranding } from '../../db/models/index.js';
import { eq } from 'drizzle-orm';
import { PicrRequestContext } from '../../types/PicrRequestContext.js';

const resolver = async (_, params, context: PicrRequestContext) => {
  await contextPermissions(context, params.folderId, 'Admin');

  const obj = await brandingForFolderId(params.folderId);

  if (!obj) {
    throw new GraphQLError('No branding found for folder: ' + params.folderId);
  }

  await db.delete(dbBranding).where(eq(dbBranding.folderId, params.folderId));
  return await dbFolderForId(params.folderId);
};

export const deleteBranding = {
  type: new GraphQLNonNull(folderType),
  resolve: resolver,
  args: {
    folderId: { type: new GraphQLNonNull(GraphQLID) },
  },
};
