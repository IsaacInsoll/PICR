export function isPublicLinkExpired(
  expiresAt: Date | string | null | undefined,
  now: Date,
): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= now.getTime();
}
