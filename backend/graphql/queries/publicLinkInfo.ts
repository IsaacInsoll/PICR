import { GraphQLNonNull, GraphQLString } from 'graphql';
import { db, dbFolderForId } from '../../db/picrDb.js';
import { dbUser } from '../../db/models/index.js';
import { eq } from 'drizzle-orm';
import { publicLinkInfoType } from '../types/publicLinkInfoType.js';
import type { PicrResolver } from '../helpers/picrResolver.js';
import { normalizeGalleryPasscode } from '@shared/auth/galleryPasscode.js';
import { normalizeDisplayName } from '@shared/displayName.js';
import { brandingForFolder } from '../helpers/brandingForFolder.js';

type PublicLinkInfoArgs = {
  uuid: string;
};

const lockedInfo = {
  available: false,
  requiresPasscode: false,
  unlocked: false,
  galleryName: null,
  branding: null,
};

const resolver: PicrResolver<object, PublicLinkInfoArgs> = async (
  _,
  params,
  context,
) => {
  const user = await db.query.dbUser.findFirst({
    where: eq(dbUser.uuid, params.uuid),
  });

  if (!user || !user.enabled || user.deleted || user.userType !== 'Link') {
    return lockedInfo;
  }

  const folder = await dbFolderForId(user.folderId);
  if (!folder) return lockedInfo;

  const branding = await brandingForFolder(folder);
  const galleryName =
    folder.title?.trim() || normalizeDisplayName(folder.name) || 'Gallery';

  const requiredPasscode = normalizeGalleryPasscode(user.galleryPasscode);
  if (!requiredPasscode) {
    return {
      available: true,
      requiresPasscode: false,
      unlocked: true,
      galleryName,
      branding,
    };
  }

  return {
    available: true,
    requiresPasscode: true,
    unlocked:
      normalizeGalleryPasscode(context.headers.galleryPasscode) ===
      requiredPasscode,
    galleryName,
    branding,
  };
};

export const publicLinkInfo = {
  type: new GraphQLNonNull(publicLinkInfoType),
  resolve: resolver,
  args: {
    uuid: { type: new GraphQLNonNull(GraphQLString) },
  },
};
