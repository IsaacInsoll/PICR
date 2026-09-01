import { expect, test } from 'vitest';
import { join } from 'node:path';
import { rm, utimes, writeFile } from 'node:fs/promises';
import { defaultCredentials } from '../../backend/auth/defaultCredentials';
import { viewFolderQuery } from '../../shared/urql/queries/viewFolderQuery';
import { createTestGraphqlClient, getUserHeader } from './testGraphqlClient';
import { pingToken, testUrl, videoFolderId } from './testVariables';

const payload = () => ({
  protocolVersion: 1,
  source: 'api-test',
  instanceId: 'api-test-instance',
  instanceUptimeMs: 10_000,
  watcherReadyUptimeMs: 5_000,
  watchPrefix: '',
});

const postPing = (body: unknown, authorization = `Bearer ${pingToken}`) =>
  fetch(`${testUrl}api/media-changed`, {
    method: 'POST',
    headers: {
      authorization,
      'content-type': 'application/json',
      'x-picr-ping-version': '0.1.0-test',
    },
    body: JSON.stringify(body),
  });

const waitForProbe = async (path: string, expected: 'missing' | 'visible') => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 10_000) {
    const response = await postPing({ ...payload(), probePath: path });
    expect(response.status).toBe(200);
    const result = (await response.json()) as {
      probe: 'ignored' | 'missing' | 'visible';
    };
    if (result.probe === expected) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for backend probe to report ${expected}`);
};

type TestClient = Awaited<ReturnType<typeof createTestGraphqlClient>>;

const findFileNamed = async (client: TestClient, name: string) => {
  const result = await client
    .query(viewFolderQuery, { folderId: videoFolderId })
    .toPromise();
  expect(result.error).toBeUndefined();
  return result.data?.folder?.files.find((file) => file.name === name);
};

const waitForFile = async (
  client: TestClient,
  name: string,
  matches: (file: Awaited<ReturnType<typeof findFileNamed>>) => boolean,
) => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 30_000) {
    const file = await findFileNamed(client, name);
    if (matches(file)) return file;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for Ping scan result for ${name}`);
};

test('unknown API routes return JSON 404 instead of the frontend', async () => {
  const response = await fetch(`${testUrl}api/not-registered`, {
    method: 'POST',
  });

  expect(response.status).toBe(404);
  expect(response.headers.get('content-type')).toContain('application/json');
  await expect(response.json()).resolves.toEqual({ error: 'Not found' });
});

test('Ping endpoint distinguishes bad credentials from a missing route', async () => {
  const missing = await postPing(
    { ...payload(), directories: [], reconcile: false },
    '',
  );
  const wrong = await postPing(
    { ...payload(), directories: [], reconcile: false },
    'Bearer wrong',
  );

  expect(missing.status).toBe(401);
  expect(wrong.status).toBe(401);
});

test('accepts heartbeats and resolves probes without queueing a scan', async () => {
  const heartbeat = await postPing({
    ...payload(),
    directories: [],
    reconcile: false,
  });
  expect(heartbeat.status).toBe(202);
  await expect(heartbeat.json()).resolves.toEqual({ accepted: 0, ignored: 0 });

  const visible = await postPing({
    ...payload(),
    probePath: 'Dog Photos/XH2A2139.jpg',
  });
  expect(visible.status).toBe(200);
  await expect(visible.json()).resolves.toEqual({ probe: 'visible' });

  const ignored = await postPing({
    ...payload(),
    probePath: 'Dog Photos/.DS_Store',
  });
  await expect(ignored.json()).resolves.toEqual({ probe: 'ignored' });

  const missing = await postPing({
    ...payload(),
    probePath: 'Dog Photos/not-there.jpg',
  });
  await expect(missing.json()).resolves.toEqual({ probe: 'missing' });
});

test('rejects oversized JSON by encoded request bytes', async () => {
  const response = await postPing({
    ...payload(),
    directories: [],
    reconcile: false,
    futureMetadata: '界'.repeat(400_000),
  });

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toMatchObject({
    code: 'INVALID_PAYLOAD',
  });
});

// `act` runs the workflow inside a container while Compose talks to the host
// Docker daemon, so new files written inside the runner are not visible through
// the sibling container's bind mount. Native GitHub Actions and normal local
// Vitest runs execute this integration test strictly.
test.skipIf(!!process.env.ACT)(
  'a Ping hint adds, modifies, and removes media through the real coordinator',
  async () => {
    const suffix = Math.random().toString(36).slice(2, 8);
    const name = `ping-lifecycle-${suffix}.txt`;
    const relativePath = `Birthday Video/${name}`;
    const path = join(
      process.cwd(),
      'tests/api/env/media/Birthday Video',
      name,
    );
    const oldEnoughForFastPath = new Date(Date.now() - 120_000);
    const headers = await getUserHeader(defaultCredentials);
    const client = await createTestGraphqlClient(headers);

    const sendDirectoryHint = async () => {
      const response = await postPing({
        ...payload(),
        directories: ['Birthday Video'],
        reconcile: false,
      });
      expect(response.status).toBe(202);
    };

    let bodyCompleted = false;
    try {
      await writeFile(path, `first ${suffix}`);
      await utimes(path, oldEnoughForFastPath, oldEnoughForFastPath);
      await waitForProbe(relativePath, 'visible');
      await sendDirectoryHint();
      const added = await waitForFile(client, name, Boolean);
      expect(added?.id).toBeDefined();
      const originalHash = added?.fileHash;

      await writeFile(path, `second version ${suffix}`);
      await utimes(path, oldEnoughForFastPath, oldEnoughForFastPath);
      await sendDirectoryHint();
      const modified = await waitForFile(
        client,
        name,
        (file) => file?.fileHash !== originalHash,
      );
      expect(modified?.id).toBe(added?.id);

      await rm(path);
      await waitForProbe(relativePath, 'missing');
      await sendDirectoryHint();
      await waitForFile(client, name, (file) => !file);
      bodyCompleted = true;
    } finally {
      try {
        await rm(path, { force: true });
        await waitForProbe(relativePath, 'missing');
        await sendDirectoryHint();
        await waitForFile(client, name, (file) => !file);
      } catch (cleanupError) {
        if (bodyCompleted) throw cleanupError;
      }
    }
  },
  90_000,
);
