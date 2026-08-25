import { describe, expect, test } from 'vitest';
import { classifyPublicLink } from '../../backend/auth/publicLinkAuth';
import type { UserFields } from '../../backend/db/picrDb';
import { requestAuthentication } from '../../backend/types/RequestAuthentication';

const now = new Date('2026-08-25T10:00:00.000Z');

const linkUser = {
  id: 42,
  createdAt: now,
  updatedAt: now,
  name: 'Public link',
  enabled: true,
  deleted: false,
  commentPermissions: 'read',
  folderId: 3,
  lastAccess: null,
  userType: 'Link',
  hashedPassword: null,
  username: null,
  ntfy: null,
  ntfyEmail: false,
  uuid: 'public-link-test',
  linkMode: 'final_delivery',
  galleryPasscode: null,
  expiresAt: null,
} satisfies UserFields;

const classify = (user: UserFields | undefined, galleryPasscode?: string) =>
  classifyPublicLink(user, galleryPasscode, now);

describe('public-link authentication outcomes', () => {
  test('distinguishes missing and wrong-type rows', () => {
    expect(classify(undefined)).toEqual({
      status: 'rejected',
      reason: 'not_found',
    });
    expect(classify({ ...linkUser, userType: 'Admin' })).toMatchObject({
      status: 'rejected',
      reason: 'wrong_user_type',
    });
  });

  test.each([
    [{ enabled: false }, 'disabled'],
    [{ deleted: true }, 'deleted'],
    [{ expiresAt: now }, 'expired'],
  ] as const)('classifies an unavailable row as %s', (changes, reason) => {
    expect(classify({ ...linkUser, ...changes })).toMatchObject({
      status: 'rejected',
      reason,
    });
  });

  test('applies rejection precedence before checking the passcode', () => {
    expect(
      classify({
        ...linkUser,
        userType: 'Admin',
        enabled: false,
        deleted: true,
        expiresAt: now,
        galleryPasscode: 'orchid',
      }),
    ).toMatchObject({ reason: 'wrong_user_type' });
    expect(
      classify({
        ...linkUser,
        enabled: false,
        deleted: true,
        expiresAt: now,
        galleryPasscode: 'orchid',
      }),
    ).toMatchObject({ reason: 'disabled' });
    expect(
      classify({
        ...linkUser,
        deleted: true,
        expiresAt: now,
        galleryPasscode: 'orchid',
      }),
    ).toMatchObject({ reason: 'deleted' });
    expect(
      classify({ ...linkUser, expiresAt: now, galleryPasscode: 'orchid' }),
    ).toMatchObject({ reason: 'expired' });
  });

  test('distinguishes a passcode challenge from authenticated access', () => {
    const protectedUser = { ...linkUser, galleryPasscode: 'orchid' };
    expect(classify(protectedUser)).toMatchObject({
      status: 'passcode_required',
      user: protectedUser,
    });

    expect(classify(protectedUser, 'orchid')).toMatchObject({
      status: 'authenticated',
      requiresPasscode: true,
    });
  });

  test('a valid JWT principal wins while retaining the link outcome', () => {
    const publicLinkAttempt = {
      uuid: linkUser.uuid!,
      outcome: {
        status: 'authenticated' as const,
        user: linkUser,
        requiresPasscode: false,
      },
    };
    const authentication = requestAuthentication(
      { ...linkUser, id: 7, userType: 'Admin' },
      publicLinkAttempt,
    );

    expect(authentication.principal).toMatchObject({
      kind: 'jwt',
      user: { id: 7 },
    });
    expect(authentication.publicLinkAttempt).toBe(publicLinkAttempt);
  });
});
