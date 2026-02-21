import { expect, test } from 'vitest';
import {
  createTestGraphqlClient,
  getUserHeader,
} from '../../frontend/testGraphqlClient';
import { defaultCredentials } from '../../backend/auth/defaultCredentials';
import { viewFolderQuery } from '../../shared/urql/queries/viewFolderQuery';
import { AllSize } from '../../frontend/src/helpers/thumbnailSize';
import { photoFolderId, testUrl } from './testVariables';

test('Express Server Online', async () => {
  const response = await fetch(testUrl);
  const text = await response.text();
  expect(text).toContain('<title>PICR</title>');
  expect(text).toContain('<div id="root"></div>');
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
  await testSize('lg');
  await testSize('raw');
});
