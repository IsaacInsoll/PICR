import { expect, test } from 'vitest';
import { configFromEnv } from '../src/config.js';
import {
  createProtocolContext,
  payloadBytes,
  PROTOCOL_VERSION,
} from '../src/protocol.js';

const config = configFromEnv({
  PATH_PREFIX: 'Archive/Studio',
  PICR_PING_NAME: 'studio-nas',
  PICR_PING_TOKEN: 'a'.repeat(64),
  PICR_URL: 'http://picr:6900/',
});

test('payloads carry stable instance and watcher-ready uptime fields', () => {
  let uptime = 100;
  const protocol = createProtocolContext({
    config,
    instanceId: 'instance-1',
    uptimeMs: () => uptime,
  });

  expect(protocol.heartbeatPayload()).toMatchObject({
    instanceId: 'instance-1',
    instanceUptimeMs: 100,
    protocolVersion: PROTOCOL_VERSION,
    watcherReadyUptimeMs: null,
  });
  uptime = 250;
  protocol.markWatcherReady();
  uptime = 400;

  expect(protocol.changePayload(['Archive/Studio/Weddings'])).toMatchObject({
    instanceUptimeMs: 400,
    watcherReadyUptimeMs: 250,
  });
});

test('auto and forced reconciliation are distinguishable on the wire', () => {
  const protocol = createProtocolContext({ config, instanceId: 'instance-1' });

  expect(
    protocol.reconcilePayload('Archive/Studio', 'auto').reconcileMode,
  ).toBe('auto');
  expect(
    protocol.reconcilePayload('Archive/Studio/Weddings', 'force').reconcileMode,
  ).toBe('force');
});

test('payload size is measured as encoded UTF-8 bytes', () => {
  const protocol = createProtocolContext({ config, instanceId: 'instance-1' });
  const ascii = protocol.changePayload(['Archive/Studio/' + 'a'.repeat(20)]);
  const unicode = protocol.changePayload(['Archive/Studio/' + '漢'.repeat(20)]);

  expect(payloadBytes(unicode)).toBeGreaterThan(payloadBytes(ascii));
});
