import { contextPermissions } from '../../auth/contextPermissions';
import { doAuthError } from '../../auth/doAuthError';
import { GraphQLID, GraphQLNonNull } from 'graphql/index';
import { folderType } from '../types/folderType';
import { db, dbFileForId } from '../../db/picrDb';
import { dbFolder } from '../../db/models';
import { eq } from 'drizzle-orm';
import { PicrRequestContext } from '../../types/PicrRequestContext';

const resolver = async (_, params, context: PicrRequestContext) => {
  const { folder } = await contextPermissions(
    context,
    params.folderId,
    'Admin',
  );

  const heroImage = await dbFileForId(params.heroImageId);
  if (!heroImage) {
    doAuthError('Invalid hero image ID');
    return;
  }
  if (heroImage.type != 'Image') doAuthError('Not an image');
  if (heroImage.folderId != folder!.id) doAuthError('Not in this folder');

  await db
    .update(dbFolder)
    .set({ heroImageId: heroImage.id, updatedAt: new Date() })
    .where(eq(dbFolder.id, folder!.id));

  return { ...folder, heroImage, heroImageId: heroImage.id };
};

export const editFolder = {
  type: new GraphQLNonNull(folderType),
  resolve: resolver,
  args: {
    folderId: { type: new GraphQLNonNull(GraphQLID) },
    heroImageId: { type: GraphQLID },
  },
};
