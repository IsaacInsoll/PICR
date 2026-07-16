import { afterEach, expect, test, vi } from 'vitest';
import {
  getLatestBuild,
  resetLatestBuildCacheForTests,
} from '../../backend/helpers/latestBuild';

const githubReleaseResponse = (tagNames: string | string[]) =>
  ({
    ok: true,
    json: async () =>
      (Array.isArray(tagNames) ? tagNames : [tagNames]).map((tag_name) => ({
        tag_name,
      })),
  }) as Response;

const githubErrorResponse = () =>
  ({
    ok: false,
    json: async () => ({ message: 'rate limit exceeded' }),
  }) as Response;

afterEach(() => {
  resetLatestBuildCacheForTests();
  vi.unstubAllGlobals();
});

test('settings force-refresh updates the latest build cache used by the dashboard', async () => {
  const fetchMock = vi.fn<typeof fetch>();
  vi.stubGlobal('fetch', fetchMock);

  fetchMock.mockResolvedValueOnce(githubReleaseResponse('1.1.0'));
  expect(await getLatestBuild()).toBe('1.1.0');

  fetchMock.mockResolvedValueOnce(githubReleaseResponse('1.1.1'));
  expect(await getLatestBuild()).toBe('1.1.0');
  expect(await getLatestBuild({ forceRefresh: true })).toBe('1.1.1');
  expect(await getLatestBuild()).toBe('1.1.1');
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test('latest build lookup keeps the stale cache value when GitHub is unavailable', async () => {
  const fetchMock = vi.fn<typeof fetch>();
  vi.stubGlobal('fetch', fetchMock);

  fetchMock.mockResolvedValueOnce(githubReleaseResponse('1.1.1'));
  expect(await getLatestBuild()).toBe('1.1.1');

  fetchMock.mockRejectedValueOnce(new Error('GitHub unavailable'));
  expect(await getLatestBuild({ forceRefresh: true })).toBe('1.1.1');
});

test('latest build lookup normalizes release tags and picks the newest semver release', async () => {
  const fetchMock = vi.fn<typeof fetch>();
  vi.stubGlobal('fetch', fetchMock);

  fetchMock.mockResolvedValueOnce(
    githubReleaseResponse([
      'v1.2.1',
      '1.2.2',
      '1.3.0-beta.1',
      'not-a-version',
      '1.2.0',
    ]),
  );

  expect(await getLatestBuild()).toBe('1.2.2');
});

test('latest build lookup does not cache GitHub error responses', async () => {
  const fetchMock = vi.fn<typeof fetch>();
  vi.stubGlobal('fetch', fetchMock);

  fetchMock.mockResolvedValueOnce(githubErrorResponse());
  expect(await getLatestBuild()).toBe('');

  fetchMock.mockResolvedValueOnce(githubReleaseResponse('1.2.2'));
  expect(await getLatestBuild()).toBe('1.2.2');
});
