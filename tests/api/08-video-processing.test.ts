import { expect, test } from 'vitest';
import { createTestGraphqlClient, getUserHeader } from './testGraphqlClient';
import { defaultCredentials } from '../../backend/auth/defaultCredentials';
import { viewFolderQuery } from '../../shared/urql/queries/viewFolderQuery';
import { testUrl, videoFolderId } from './testVariables';

const getVideoFile = async () => {
  const headers = await getUserHeader(defaultCredentials);
  const client = await createTestGraphqlClient(headers);
  const result = await client
    .query(viewFolderQuery, { folderId: videoFolderId })
    .toPromise();

  expect(result.error).toBeUndefined();
  const file = result.data?.folder?.files.find(
    (item) => item.__typename === 'Video',
  );
  expect(file).toBeDefined();

  return file!;
};

test('Video sample has extracted metadata', async () => {
  const video = await getVideoFile();

  expect(video.name).toBe('Jess Birthday.mp4');
  expect(video.duration).toBeGreaterThan(18);
  expect(video.duration).toBeLessThan(19);
  expect(video.imageRatio).toBeGreaterThan(0.55);
  expect(video.imageRatio).toBeLessThan(0.57);
  expect(video.metadata).toBeDefined();
  expect(video.metadata?.Duration).toBeGreaterThan(18);
  expect(video.metadata?.Duration).toBeLessThan(19);
  expect(video.metadata?.Bitrate).toBeGreaterThan(5_000_000);
  expect(video.metadata?.Bitrate).toBeLessThan(5_300_000);
  expect(video.metadata?.Format).toBe('QuickTime / MOV');
  expect(video.metadata?.Width).toBeGreaterThan(1000);
  expect(video.metadata?.Width).toBeLessThan(1100);
  expect(video.metadata?.Height).toBeGreaterThan(1900);
  expect(video.metadata?.Height).toBeLessThan(1950);
  expect(video.metadata?.Framerate).toBeGreaterThan(49);
  expect(video.metadata?.Framerate).toBeLessThan(51);
  expect(video.metadata?.VideoCodec).toBe('hevc');
  expect(video.metadata?.AudioCodec).toBe('aac');
});

test('Video thumbnail montage is generated and served', async () => {
  const video = await getVideoFile();

  const response = await fetch(
    `${testUrl}image/${video.id}/md/${video.fileHash}/joined.jpg`,
  );

  expect(response.status).toBe(200);
  expect(response.headers.get('content-type')).toContain('image/jpeg');
  const bytes = new Uint8Array(await response.arrayBuffer());
  expect(bytes.length).toBeGreaterThan(10_000);
});
