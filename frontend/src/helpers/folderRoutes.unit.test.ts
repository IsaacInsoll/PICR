import { describe, expect, test } from 'vitest';
import { folderIdFromPath } from './folderRoutes';

describe('folder routes', () => {
  test.each([
    ['/admin/f/12', '12'],
    ['/admin/f/12/34', '12'],
    ['/admin/f/12/activity', '12'],
    ['/s/link-token/56', '56'],
    ['/s/link-token/56/78', '56'],
    ['/admin', undefined],
    ['/admin/settings', undefined],
  ])('finds the current gallery folder in %s', (pathname, expected) => {
    expect(folderIdFromPath(pathname)).toBe(expected);
  });
});
