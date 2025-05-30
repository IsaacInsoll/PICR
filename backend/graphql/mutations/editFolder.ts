import { contextPermissions } from '../../auth/contextPermissions.js';
import { doAuthError } from '../../auth/doAuthError.js';
import { GraphQLID, GraphQLNonNull } from 'graphql';
import { folderType } from '../types/folderType.js';
import { db, dbFileForId } from '../../db/picrDb.js';
import { PicrRequestContext } from '../../types/PicrRequestContext.js';
import { setHeroImage } from './setHeroImage.js';
import { folderAndAllParentIds } from '../../helpers/folderAndAllParentIds.js';
import { and, inArray } from 'drizzle-orm';
import { dbFolder } from '../../db/models/index.js';
import { GraphQLFieldResolver } from 'graphql/type/index.js';

const resolver: GraphQLFieldResolver<any, PicrRequestContext> = async (
  _,
  params,
  context,
) => {
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

  await setHeroImage(heroImage.id, folder!.id);

  //for all parent folders: if they don't have their own in-folder hero image, update it to be this one too
  const allParentIds = await folderAndAllParentIds(
    folder,
    context.userHomeFolder!.id,
  );
  const parents = await db.query.dbFolder.findMany({
    where: and(
      inArray(dbFolder.id, allParentIds),
      // ne(dbFolder.id, dbFile.folderId), //this didn't work :/
    ),
    with: { heroImage: true },
  });

  const parentsWithoutHeroes = parents.filter(
    ({ id, heroImage }) => id !== heroImage?.folderId,
  );
  await db
    .update(dbFolder)
    .set({ heroImageId: params.heroImageId, updatedAt: new Date() })
    .where(
      inArray(
        dbFolder.id,
        parentsWithoutHeroes.map(({ id }) => id),
      ),
    );

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
