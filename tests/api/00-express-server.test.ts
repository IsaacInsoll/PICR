import { expect, test } from 'vitest';
import { createTestGraphqlClient, getUserHeader } from './testGraphqlClient';
import { defaultCredentials } from '../../backend/auth/defaultCredentials';
import { viewFolderQuery } from '../../shared/urql/queries/viewFolderQuery';
import { AllSize } from '../../shared/thumbnailSize';
import { photoFolderId, testUrl } from './testVariables';
import { thumbnailVariantForWidth } from '../../shared/thumbnailVariants';

test('Express Server Online', async () => {
  const response = await fetch(testUrl);
  const text = await response.text();
  expect(text).toContain('<title>PICR</title>');
  expect(text).toContain('<div id="root"></div>');
});

test('Compresses frontend JavaScript when the client accepts gzip', async () => {
  const indexResponse = await fetch(testUrl, {
    headers: { 'accept-encoding': 'identity' },
  });
  const indexHtml = await indexResponse.text();
  const entryPath = indexHtml.match(/src="([^"]+\.js)"/)?.[1];
  if (!entryPath) throw new Error('Frontend entry script was not found');

  const response = await fetch(new URL(entryPath, testUrl), {
    headers: { 'accept-encoding': 'gzip' },
  });

  expect(response.status).toBe(200);
  expect(response.headers.get('content-encoding')).toBe('gzip');
  expect(response.headers.get('vary')).toContain('Accept-Encoding');
  expect((await response.text()).length).toBeGreaterThan(1_000);
});

test('Health endpoints are served before the frontend catch-all', async () => {
  const healthResponse = await fetch(`${testUrl}healthz`);
  expect(healthResponse.status).toBe(200);
  await expect(healthResponse.json()).resolves.toEqual({ status: 'ok' });

  const readyResponse = await fetch(`${testUrl}readyz`);
  expect(readyResponse.status).toBe(200);
  await expect(readyResponse.json()).resolves.toEqual({ status: 'ok' });
});

test('Request Image from Express Server', async () => {
  const headers = await getUserHeader(defaultCredentials);
  const client = await createTestGraphqlClient(headers);

  const result = await client
    .query(viewFolderQuery, { folderId: photoFolderId })
    .toPromise();
  expect(result.error).toBeUndefined();
  expect(result.data?.folder?.files?.length).toBeGreaterThan(0);
  const file = result.data!.folder.files[0];

  expect(file.id).toBeTruthy();
  expect(file.fileHash).toBeTruthy();
  expect(file.name).toBeTruthy();

  const { id, fileHash, name } = file;

  let prevSize = 0;

  // i want to `allSizes.forEach` but can't because `await` must be top level and the test completes before `.then()` callback fires
  const testSize = async (size: AllSize) => {
    const fullUrl = `${testUrl}image/${id}/${size}/${fileHash}/${name}`;
    const response = await fetch(fullUrl);
    expect(response.status).toBe(200);
    const responseSize =
      parseInt(response.headers.get('content-length') ?? '0') ?? 0;
    //Ensure The Maximus gets bigger each time
    expect(responseSize).toBeGreaterThan(prevSize);
    prevSize = responseSize;
  };
  await testSize('sm');
  await testSize('md');
  const avifResponse = await fetch(
    `${testUrl}image/${id}/md/${fileHash}/${name}.avif`,
  );
  expect(avifResponse.status).toBe(404);
  expect(avifResponse.headers.get('cache-control')).toBeNull();

  const variant = thumbnailVariantForWidth(1000);
  const variantResponse = await fetch(
    `${testUrl}image/${id}/${variant.token}/${fileHash}/${name}.png`,
  );
  expect(variantResponse.status).toBe(200);
  expect(variantResponse.headers.get('content-type')).toContain(
    variant.mimeType,
  );
  expect(variantResponse.headers.get('cache-control')).toBe(
    'public, max-age=86400',
  );

  const decorativeAvifResponse = await fetch(
    `${testUrl}image/${id}/${variant.token}/${fileHash}/${name}.avif`,
  );
  expect(decorativeAvifResponse.status).toBe(200);
  expect(decorativeAvifResponse.headers.get('content-type')).toContain(
    variant.mimeType,
  );

  const invalidVariantResponse = await fetch(
    `${testUrl}image/${id}/v1-1024j80/${fileHash}/${name}`,
  );
  expect(invalidVariantResponse.status).toBe(400);
  expect(invalidVariantResponse.headers.get('cache-control')).toBeNull();

  const nonCanonicalVariantResponse = await fetch(
    `${testUrl}image/${id}/v1-01000j80/${fileHash}/${name}`,
  );
  expect(nonCanonicalVariantResponse.status).toBe(400);
  expect(nonCanonicalVariantResponse.headers.get('cache-control')).toBeNull();

  await testSize('lg');
  await testSize('raw');
});
