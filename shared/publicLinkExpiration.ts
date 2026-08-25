export type PublicLinkStatus = 'active' | 'disabled' | 'expired';

type PublicLinkExpirationInput = Date | number | string;

type PublicLinkStatusInput = {
  enabled?: boolean | null;
  expiresAt?: PublicLinkExpirationInput | null;
};

const timestampFor = (value: PublicLinkExpirationInput): number =>
  value instanceof Date ? value.getTime() : new Date(value).getTime();

export const isPublicLinkExpired = (
  expiresAt: PublicLinkExpirationInput | null | undefined,
  now: Date | number,
): boolean => {
  if (expiresAt == null) return false;

  const expirationTime = timestampFor(expiresAt);
  const currentTime = typeof now === 'number' ? now : now.getTime();

  // Invalid persisted deadlines must not silently make a link available.
  return !Number.isFinite(expirationTime) || expirationTime <= currentTime;
};

export const publicLinkStatus = (
  link: PublicLinkStatusInput,
  now: Date | number,
): PublicLinkStatus => {
  if (!link.enabled) return 'disabled';
  if (isPublicLinkExpired(link.expiresAt, now)) return 'expired';
  return 'active';
};
