import { contextPermissions } from '../../auth/contextPermissions';
import { GraphQLID, GraphQLNonNull } from 'graphql';
import { folderType } from '../types/folderType';
import { GraphQLError } from 'graphql/error';
import { brandingForFolderId, db, dbFolderForId } from '../../db/picrDb';
import { dbBranding } from '../../db/models';
import { eq } from 'drizzle-orm';

const resolver = async (_, params, context) => {
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
