import { GraphQLNonNull, GraphQLString } from 'graphql';
import { publicLinkInfoType } from '../types/publicLinkInfoType.js';
import type { PicrResolver } from '../helpers/picrResolver.js';
import { normalizeDisplayName } from '@shared/displayName.js';
import { brandingForFolder } from '../helpers/brandingForFolder.js';
import { resolvePublicLinkAttempt } from '../../auth/publicLinkAttempt.js';

type PublicLinkInfoArgs = {
  uuid: string;
};

const unavailableInfo = {
  status: 'UNAVAILABLE',
  expiresAt: null,
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
  let attempt = context.authentication.publicLinkAttempt;
  if (attempt && params.uuid !== attempt.uuid) {
    return unavailableInfo;
  }
  if (!attempt) {
    attempt = await resolvePublicLinkAttempt(
      params.uuid,
      context.headers.galleryPasscode,
      new Date(),
    );
  }

  const { outcome, homeFolder: folder } = attempt;
  if (outcome.status === 'rejected') {
    if (outcome.reason !== 'expired' || !folder || !outcome.user?.expiresAt) {
      return unavailableInfo;
    }
    return {
      ...unavailableInfo,
      status: 'EXPIRED',
      expiresAt: outcome.user.expiresAt,
      branding: await brandingForFolder(folder),
    };
  }

  if (!folder) return unavailableInfo;

  const branding = await brandingForFolder(folder);
  const galleryName =
    folder.title?.trim() ||
    (folder.parentId === null
      ? null
      : normalizeDisplayName(folder.name) || 'Gallery');

  if (outcome.status === 'authenticated') {
    return {
      status: 'AVAILABLE',
      expiresAt: outcome.user.expiresAt,
      available: true,
      requiresPasscode: outcome.requiresPasscode,
      unlocked: true,
      galleryName,
      branding,
    };
  }

  return {
    status: 'PASSCODE_REQUIRED',
    expiresAt: null,
    available: true,
    requiresPasscode: true,
    unlocked: false,
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
