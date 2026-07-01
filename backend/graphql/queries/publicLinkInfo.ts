import { GraphQLNonNull, GraphQLString } from 'graphql';
import { db } from '../../db/picrDb.js';
import { dbUser } from '../../db/models/index.js';
import { eq } from 'drizzle-orm';
import { publicLinkInfoType } from '../types/publicLinkInfoType.js';
import type { PicrResolver } from '../helpers/picrResolver.js';
import { normalizeGalleryPasscode } from '@shared/auth/galleryPasscode.js';

type PublicLinkInfoArgs = {
  uuid: string;
};

const lockedInfo = {
  requiresPasscode: true,
  unlocked: false,
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

  const requiredPasscode = normalizeGalleryPasscode(user.galleryPasscode);
  if (!requiredPasscode) {
    return {
      requiresPasscode: false,
      unlocked: true,
    };
  }

  return {
    requiresPasscode: true,
    unlocked:
      normalizeGalleryPasscode(context.headers.galleryPasscode) ===
      requiredPasscode,
  };
};

export const publicLinkInfo = {
  type: new GraphQLNonNull(publicLinkInfoType),
  resolve: resolver,
  args: {
    uuid: { type: new GraphQLNonNull(GraphQLString) },
  },
};
