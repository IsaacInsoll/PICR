import { afterEach, expect, test } from 'vitest';
import {
  getPingStatus,
  MAX_PING_SOURCES,
  observePingSource,
  PingSourceLimitError,
  PingSourcePrefixError,
  recordPingBatch,
  resetPingStatusForTests,
} from '../../backend/filesystem/pingStatus.js';

const coordinator = {
  state: 'idle' as const,
  pendingFolders: 0,
  foldersScanned: 0,
  lastError: null,
};

afterEach(resetPingStatusForTests);

test('retains independent source status and since-start hint counts', () => {
  const receivedAt = new Date('2026-08-26T00:00:00.000Z');
  observePingSource({
    name: 'studio-b',
    instanceId: 'b',
    watchPrefix: 'B',
    pingVersion: '0.1.0',
    receivedAt,
  });
  observePingSource({
    name: 'studio-a',
    instanceId: 'a',
    watchPrefix: 'A',
    pingVersion: '0.1.0',
    receivedAt,
  });
  recordPingBatch('studio-a', 3, receivedAt);

  const status = getPingStatus(true, coordinator);
  expect(status.sources.map((source) => source.name)).toEqual([
    'studio-a',
    'studio-b',
  ]);
  expect(status.sources[0]).toMatchObject({
    hintsReceived: 3,
    lastBatchAt: receivedAt.toISOString(),
  });
});

test('rejects a prefix change within one source instance', () => {
  const observation = {
    name: 'studio',
    instanceId: 'same',
    watchPrefix: 'Archive/A',
    pingVersion: '0.1.0',
    receivedAt: new Date(),
  };
  observePingSource(observation);
  expect(() =>
    observePingSource({ ...observation, watchPrefix: 'Archive/B' }),
  ).toThrow(PingSourcePrefixError);
});

test('allows a new instance to adopt a new prefix', () => {
  const observation = {
    name: 'studio',
    instanceId: 'old',
    watchPrefix: 'Archive/A',
    pingVersion: '0.1.0',
    receivedAt: new Date(),
  };
  observePingSource(observation);
  observePingSource({
    ...observation,
    instanceId: 'new',
    watchPrefix: 'Archive/B',
  });

  expect(getPingStatus(true, coordinator).sources[0]).toMatchObject({
    instanceId: 'new',
    watchPrefix: 'Archive/B',
  });
});

test('caps retained sources', () => {
  for (let index = 0; index < MAX_PING_SOURCES; index++) {
    observePingSource({
      name: `source-${index}`,
      instanceId: `instance-${index}`,
      watchPrefix: '',
      pingVersion: '0.1.0',
      receivedAt: new Date(),
    });
  }

  expect(() =>
    observePingSource({
      name: 'one-too-many',
      instanceId: 'extra',
      watchPrefix: '',
      pingVersion: '0.1.0',
      receivedAt: new Date(),
    }),
  ).toThrow(PingSourceLimitError);
});
