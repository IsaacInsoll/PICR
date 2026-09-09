import { expect, test } from 'vitest';
import { join } from 'node:path';
import { rm, utimes, writeFile } from 'node:fs/promises';
import { defaultCredentials } from '../../backend/auth/defaultCredentials';
import { serverInfoQuery } from '../../shared/urql/queries/serverInfoQuery';
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

const getPingCoordinatorStatus = async (client: TestClient) => {
  const result = await client.query(serverInfoQuery, {}).toPromise();
  expect(result.error).toBeUndefined();
  const status = result.data?.serverInfo?.scanning.ping.coordinator;
  if (!status) throw new Error('Ping coordinator status was unavailable');
  return status;
};

const waitForPingCycle = async (
  client: TestClient,
  foldersScannedBeforeHint: number,
  stage: string,
) => {
  const startedAt = Date.now();
  let lastStatus: Awaited<ReturnType<typeof getPingCoordinatorStatus>> | null =
    null;

  while (Date.now() - startedAt < 30_000) {
    lastStatus = await getPingCoordinatorStatus(client);
    if (lastStatus.state === 'degraded') {
      throw new Error(
        `Ping coordinator degraded during ${stage}: ${JSON.stringify(lastStatus)}`,
      );
    }
    if (
      lastStatus.state === 'idle' &&
      lastStatus.pendingFolders === 0 &&
      lastStatus.foldersScanned > foldersScannedBeforeHint
    ) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(
    `Timed out waiting for Ping coordinator during ${stage}: ${JSON.stringify(lastStatus)}`,
  );
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

// This lifecycle case originally waited only for the file query to change after
// the endpoint returned 202. That did not distinguish a slow/degraded scan from
// a lost hint, and its timeout hid the coordinator state that could explain a CI
// failure. It now waits for foldersScanned to advance and the coordinator to
// return to idle, then checks the file once. The filesystem probe remains because
// CI bind mounts have previously lagged behind writes made by the runner.
//
// `act` runs the workflow inside a container while Compose talks to the host
// Docker daemon, so new files written inside the runner are not visible through
// the sibling container's bind mount. Native GitHub Actions and normal local
// Vitest runs execute this integration test strictly. If this completion-aware
// version still flakes in native CI, remove this one mutable-filesystem lifecycle
// case instead of adding more sleeps/timeouts; keep the stable endpoint and unit
// coverage around it.
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

    const sendDirectoryHintAndWait = async (stage: string) => {
      const before = await getPingCoordinatorStatus(client);
      expect(before).toMatchObject({ state: 'idle', pendingFolders: 0 });
      const response = await postPing({
        ...payload(),
        directories: ['Birthday Video'],
        reconcile: false,
      });
      expect(response.status).toBe(202);
      await waitForPingCycle(client, before.foldersScanned, stage);
    };

    let bodyCompleted = false;
    try {
      await writeFile(path, `first ${suffix}`);
      await utimes(path, oldEnoughForFastPath, oldEnoughForFastPath);
      await waitForProbe(relativePath, 'visible');
      await sendDirectoryHintAndWait('adding the lifecycle fixture');
      const added = await findFileNamed(client, name);
      expect(added?.id).toBeDefined();
      const originalHash = added?.fileHash;

      await writeFile(path, `second version ${suffix}`);
      await utimes(path, oldEnoughForFastPath, oldEnoughForFastPath);
      await sendDirectoryHintAndWait('modifying the lifecycle fixture');
      const modified = await findFileNamed(client, name);
      expect(modified?.fileHash).not.toBe(originalHash);
      expect(modified?.id).toBe(added?.id);

      await rm(path);
      await waitForProbe(relativePath, 'missing');
      await sendDirectoryHintAndWait('removing the lifecycle fixture');
      expect(await findFileNamed(client, name)).toBeUndefined();
      bodyCompleted = true;
    } finally {
      try {
        await rm(path, { force: true });
        await waitForProbe(relativePath, 'missing');
        await sendDirectoryHintAndWait('cleaning up the lifecycle fixture');
        expect(await findFileNamed(client, name)).toBeUndefined();
      } catch (cleanupError) {
        if (bodyCompleted) throw cleanupError;
      }
    }
  },
  90_000,
);
