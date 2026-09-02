import { normalizeGalleryPasscode } from '@shared/auth/galleryPasscode.js';
import { isPublicLinkExpired } from '@shared/publicLinkExpiration.js';
import type { UserFields } from '../db/picrDb.js';

export type PublicLinkRejectionReason =
  'not_found' | 'wrong_user_type' | 'disabled' | 'deleted' | 'expired';

export type PublicLinkAuthOutcome =
  | {
      status: 'authenticated';
      user: UserFields;
      requiresPasscode: boolean;
    }
  | {
      status: 'passcode_required';
      user: UserFields;
    }
  | {
      status: 'rejected';
      reason: PublicLinkRejectionReason;
      user?: UserFields;
    };

export const classifyPublicLink = (
  user: UserFields | undefined,
  galleryPasscode: string | undefined,
  now: Date,
): PublicLinkAuthOutcome => {
  if (!user) return { status: 'rejected', reason: 'not_found' };
  if (user.userType !== 'Link') {
    return { status: 'rejected', reason: 'wrong_user_type', user };
  }
  if (!user.enabled) return { status: 'rejected', reason: 'disabled', user };
  if (user.deleted) return { status: 'rejected', reason: 'deleted', user };
  if (isPublicLinkExpired(user.expiresAt, now)) {
    return { status: 'rejected', reason: 'expired', user };
  }

  const requiredPasscode = normalizeGalleryPasscode(user.galleryPasscode);
  if (
    requiredPasscode &&
    normalizeGalleryPasscode(galleryPasscode) !== requiredPasscode
  ) {
    return { status: 'passcode_required', user };
  }

  return {
    status: 'authenticated',
    user,
    requiresPasscode: !!requiredPasscode,
  };
};

export const publicLinkPreviewUser = (
  outcome: PublicLinkAuthOutcome,
): UserFields | undefined => {
  if (outcome.status !== 'rejected') return outcome.user;
  return outcome.reason === 'expired' ? outcome.user : undefined;
};
