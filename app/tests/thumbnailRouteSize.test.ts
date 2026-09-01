import { describe, expect, it } from '@jest/globals';
import { thumbnailRouteSizeForWidth } from '@/src/helpers/thumbnailRouteSize';

const variants = [
  {
    token: 'v1-1000j73',
    width: 1000,
    format: 'jpeg',
    mimeType: 'image/jpeg',
    quality: 73,
  },
  {
    token: 'v1-250j73',
    width: 250,
    format: 'jpeg',
    mimeType: 'image/jpeg',
    quality: 73,
  },
  {
    token: 'v1-500j73',
    width: 500,
    format: 'jpeg',
    mimeType: 'image/jpeg',
    quality: 73,
  },
] as const;

describe('thumbnailRouteSizeForWidth', () => {
  it('selects the smallest server variant that covers the target width', () => {
    expect(thumbnailRouteSizeForWidth(variants, 251)).toBe('v1-500j73');
    expect(thumbnailRouteSizeForWidth(variants, 1000)).toBe('v1-1000j73');
  });

  it('uses the largest published variant when the target is larger', () => {
    expect(thumbnailRouteSizeForWidth(variants, 2000)).toBe('v1-1000j73');
  });

  it('does not fabricate a token before server configuration is available', () => {
    expect(thumbnailRouteSizeForWidth([], 500)).toBeUndefined();
  });
});
