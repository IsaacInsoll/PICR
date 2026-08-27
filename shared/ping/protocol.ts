export const PICR_PING_V1_PROTOCOL_VERSION = 1;
export const PICR_PING_V1_MAX_REQUEST_BYTES = 1024 * 1024;
export const PICR_PING_V1_MAX_DIRECTORIES = 1000;
export const PICR_PING_STALE_AFTER_MS = 3 * 60 * 1000;

export const normalisePicrPingV1Path = (
  value: string,
  label = 'path',
  maxLength = 255,
): string => {
  if (value === '') return '';
  if (value.startsWith('/') || value.includes('\\') || /\p{Cc}/u.test(value)) {
    throw new Error(`${label} must be a safe relative path`);
  }
  const segments = value.split('/');
  if (segments.some((segment) => segment === '.' || segment === '..')) {
    throw new Error(`${label} must be a safe relative path`);
  }
  if (segments.some((segment) => segment === '')) {
    throw new Error(`${label} must be a normalised relative path`);
  }
  if ([...value].length > maxLength) {
    throw new Error(`${label} must be at most ${maxLength} characters`);
  }
  return value;
};

export const picrPingV1PathIsWithin = (path: string, prefix: string): boolean =>
  prefix === '' || path === prefix || path.startsWith(`${prefix}/`);
