import { contextPermissions } from '../../auth/contextPermissions.js';
import { doAuthError } from '../../auth/doAuthError.js';
import {
  GraphQLError,
  GraphQLID,
  GraphQLNonNull,
  GraphQLString,
} from 'graphql';
import { folderType } from '../types/folderType.js';
import { db, dbFileForId, dbFolderForId } from '../../db/picrDb.js';
import { setHeroImage } from './setHeroImage.js';
import { folderAndAllParentIds } from '../../helpers/folderAndAllParentIds.js';
import { and, eq, inArray } from 'drizzle-orm';
import { dbFolder } from '../../db/models/index.js';
import type { PicrResolver } from '../helpers/picrResolver.js';
import type { MutationEditFolderArgs } from '@shared/gql/graphql.js';
import { AUTH_REASON } from '@shared/auth/authErrorContract.js';
import {
  BANNER_SIZES,
  BANNER_H_ALIGNS,
  BANNER_V_ALIGNS,
} from '@shared/branding/galleryPresets.js';

type EditFolderArgs = MutationEditFolderArgs;

const maxFolderTextLength = 255;

const normalizeOptionalText = (value: unknown) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') return null;
  return value.trim().length === 0 ? null : value;
};

const validateOptionalText = (
  value: string | null | undefined,
  label: string,
) => {
  if (value && value.length > maxFolderTextLength) {
    throw new GraphQLError(
      `${label} must be ${maxFolderTextLength} characters or fewer`,
    );
  }
};

const resolver: PicrResolver<object, EditFolderArgs> = async (
  _,
  params,
  context,
) => {
  const { folder } = await contextPermissions(
    context,
    params.folderId,
    'Admin',
  );

  let heroImage = undefined;
  if (params.heroImageId !== undefined && params.heroImageId !== null) {
    heroImage = await dbFileForId(params.heroImageId);
    if (!heroImage) {
      doAuthError('INVALID_HERO_IMAGE');
      return;
    }
    if (heroImage.type !== 'Image') doAuthError('INVALID_HERO_IMAGE_TYPE');
    if (heroImage.folderId !== folder.id)
      doAuthError('HERO_IMAGE_OUT_OF_SCOPE');

    await setHeroImage(heroImage.id, folder.id);

    //for all parent folders: if they don't have their own in-folder hero image, update it to be this one too
    const allParentIds = await folderAndAllParentIds(
      folder,
      context.userHomeFolder?.id ?? 1,
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
  }

  if (params.bannerImageId !== undefined) {
    const bannerImageId = params.bannerImageId
      ? parseInt(params.bannerImageId, 10)
      : null;
    if (bannerImageId !== null) {
      const bannerImage = await dbFileForId(bannerImageId);
      if (!bannerImage) {
        doAuthError(AUTH_REASON.INVALID_BANNER_IMAGE);
        return;
      }
      if (bannerImage.type !== 'Image')
        doAuthError(AUTH_REASON.INVALID_BANNER_IMAGE_TYPE);
      if (bannerImage.folderId !== folder.id)
        doAuthError(AUTH_REASON.BANNER_IMAGE_OUT_OF_SCOPE);
    }
    await db
      .update(dbFolder)
      .set({ bannerImageId, updatedAt: new Date() })
      .where(eq(dbFolder.id, folder.id));
  }

  if (
    params.bannerSize !== undefined &&
    params.bannerSize !== null &&
    !(BANNER_SIZES as readonly string[]).includes(params.bannerSize)
  ) {
    throw new GraphQLError(`Unknown banner size: ${params.bannerSize}`);
  }

  if (
    params.bannerTextHAlign !== undefined &&
    params.bannerTextHAlign !== null &&
    !(BANNER_H_ALIGNS as readonly string[]).includes(params.bannerTextHAlign)
  ) {
    throw new GraphQLError(
      `Unknown banner text horizontal alignment: ${params.bannerTextHAlign}`,
    );
  }

  if (
    params.bannerTextVAlign !== undefined &&
    params.bannerTextVAlign !== null &&
    !(BANNER_V_ALIGNS as readonly string[]).includes(params.bannerTextVAlign)
  ) {
    throw new GraphQLError(
      `Unknown banner text vertical alignment: ${params.bannerTextVAlign}`,
    );
  }

  const updates: Partial<typeof dbFolder.$inferInsert> = {};
  const title = normalizeOptionalText(params.title);
  const subtitle = normalizeOptionalText(params.subtitle);
  validateOptionalText(title, 'Title');
  validateOptionalText(subtitle, 'Subtitle');
  if (title !== undefined) updates.title = title;
  if (subtitle !== undefined) updates.subtitle = subtitle;
  if (params.bannerSize !== undefined)
    updates.bannerSize = params.bannerSize ?? null;
  if (params.bannerTextHAlign !== undefined)
    updates.bannerTextHAlign = params.bannerTextHAlign ?? null;
  if (params.bannerTextVAlign !== undefined)
    updates.bannerTextVAlign = params.bannerTextVAlign ?? null;

  if (Object.keys(updates).length > 0) {
    await db
      .update(dbFolder)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(dbFolder.id, folder.id));
  }

  const updatedFolder = await dbFolderForId(folder.id);
  return {
    ...(updatedFolder ?? folder),
    ...(heroImage ? { heroImage, heroImageId: heroImage.id } : {}),
  };
};

export const editFolder = {
  type: new GraphQLNonNull(folderType),
  resolve: resolver,
  args: {
    folderId: { type: new GraphQLNonNull(GraphQLID) },
    heroImageId: { type: GraphQLID },
    bannerImageId: { type: GraphQLID },
    bannerSize: { type: GraphQLString },
    bannerTextHAlign: { type: GraphQLString },
    bannerTextVAlign: { type: GraphQLString },
    title: { type: GraphQLString },
    subtitle: { type: GraphQLString },
  },
};
