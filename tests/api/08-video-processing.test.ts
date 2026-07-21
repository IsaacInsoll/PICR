import { expect, test } from 'vitest';
import { createTestGraphqlClient, getUserHeader } from './testGraphqlClient';
import { defaultCredentials } from '../../backend/auth/defaultCredentials';
import { viewFolderQuery } from '../../shared/urql/queries/viewFolderQuery';
import { testUrl, videoFolderId } from './testVariables';
import { openSharp } from '../../backend/media/openSharp';

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
  expect(video.metadata?.Bitrate).toBeGreaterThan(1_100_000);
  expect(video.metadata?.Bitrate).toBeLessThan(1_300_000);
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

test('Video-only folder uses a video poster as the hero image', async () => {
  const headers = await getUserHeader(defaultCredentials);
  const client = await createTestGraphqlClient(headers);
  const result = await client
    .query(viewFolderQuery, { folderId: videoFolderId })
    .toPromise();

  expect(result.error).toBeUndefined();
  const folder = result.data?.folder;
  const video = folder?.files.find((item) => item.__typename === 'Video');
  expect(video).toBeDefined();
  const heroImage = folder?.heroImage;
  expect(heroImage?.__typename).toBe('Video');
  expect(heroImage?.id).toBe(video?.id);
  if (heroImage?.__typename !== 'Video') throw new Error('Expected video hero');
  expect(heroImage.imageRatio).toBeGreaterThan(0.55);
  expect(heroImage.imageRatio).toBeLessThan(0.57);
});

test('Video poster thumbnails and scrub sprite are generated and served', async () => {
  const video = await getVideoFile();

  const posterResponses = await Promise.all(
    (['sm', 'md', 'lg'] as const).map(async (size) => {
      const response = await fetch(
        `${testUrl}image/${video.id}/${size}/${video.fileHash}/poster.jpg`,
      );
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('image/jpeg');
      return {
        size,
        bytes: new Uint8Array(await response.arrayBuffer()),
      };
    }),
  );

  const dimensions = await Promise.all(
    posterResponses.map(async ({ size, bytes }) => ({
      size,
      metadata: await openSharp(Buffer.from(bytes)).metadata(),
      bytes,
    })),
  );
  expect(dimensions.find(({ size }) => size === 'sm')?.metadata).toMatchObject({
    width: 141,
    height: 250,
  });
  expect(dimensions.find(({ size }) => size === 'md')?.metadata).toMatchObject({
    width: 281,
    height: 500,
  });
  expect(dimensions.find(({ size }) => size === 'lg')?.metadata).toMatchObject({
    width: 1080,
    height: 1920,
  });
  expect(
    dimensions.find(({ size }) => size === 'lg')?.bytes.length,
  ).toBeGreaterThan(50_000);

  const scrubResponse = await fetch(
    `${testUrl}image/${video.id}/scrub/${video.fileHash}/scrub.jpg`,
  );
  expect(scrubResponse.status).toBe(200);
  expect(scrubResponse.headers.get('content-type')).toContain('image/jpeg');
  const scrubBytes = new Uint8Array(await scrubResponse.arrayBuffer());
  const scrubMetadata = await openSharp(Buffer.from(scrubBytes)).metadata();
  expect(scrubMetadata).toMatchObject({
    width: 281,
    height: 5000,
  });
  expect(scrubBytes.length).toBeGreaterThan(100_000);
});
