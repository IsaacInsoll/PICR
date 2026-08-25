import { describe, expect, test } from 'vitest';
import {
  isPublicLinkExpired,
  publicLinkStatus,
} from '../../shared/publicLinkExpiration';

describe('public link expiration', () => {
  const now = new Date('2026-08-24T10:00:00.000Z');

  test('links without a deadline do not expire', () => {
    expect(isPublicLinkExpired(null, now)).toBe(false);
    expect(isPublicLinkExpired(undefined, now)).toBe(false);
  });

  test('the deadline is inclusive', () => {
    expect(isPublicLinkExpired('2026-08-24T09:59:59.999Z', now)).toBe(true);
    expect(isPublicLinkExpired('2026-08-24T10:00:00.000Z', now)).toBe(true);
    expect(isPublicLinkExpired('2026-08-24T10:00:00.001Z', now)).toBe(false);
  });

  test('invalid non-null deadlines fail closed', () => {
    expect(isPublicLinkExpired('not-a-date', now)).toBe(true);
  });

  test('explicitly disabled links remain disabled regardless of expiry', () => {
    expect(
      publicLinkStatus(
        {
          enabled: false,
          expiresAt: '2026-08-24T09:00:00.000Z',
        },
        now,
      ),
    ).toBe('disabled');
    expect(
      publicLinkStatus(
        {
          enabled: true,
          expiresAt: '2026-08-24T09:00:00.000Z',
        },
        now,
      ),
    ).toBe('expired');
  });
});
