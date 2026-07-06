import { afterEach, expect, test, vi } from 'vitest';
import {
  getLatestBuild,
  resetLatestBuildCacheForTests,
} from '../../backend/helpers/latestBuild';

const githubReleaseResponse = (tagName: string) =>
  ({
    json: async () => [{ tag_name: tagName }],
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
