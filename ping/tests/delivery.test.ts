import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { configFromEnv } from '../src/config.js';
import {
  commonAncestor,
  createDeliveryService,
  sendPayload,
} from '../src/delivery.js';
import type { PingLogger } from '../src/logger.js';
import { createProtocolContext } from '../src/protocol.js';

const config = configFromEnv({
  PATH_PREFIX: 'Archive/Studio',
  PICR_PING_NAME: 'studio-nas',
  PICR_PING_TOKEN: 'a'.repeat(64),
  PICR_URL: 'http://picr:6900/base/',
});

const logger: PingLogger = {
  banner: vi.fn(),
  log: vi.fn(),
};

const payloadForCall = (fetchImpl: ReturnType<typeof vi.fn>, index: number) => {
  const init = fetchImpl.mock.calls[index]?.[1];
  if (!init || typeof init.body !== 'string') {
    throw new Error(`Fetch call ${index} did not contain a JSON body`);
  }
  return JSON.parse(init.body) as Record<string, unknown>;
};

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

test('classifies retryable and permanent HTTP responses', async () => {
  const protocol = createProtocolContext({ config, instanceId: 'instance-1' });
  const payload = protocol.heartbeatPayload();

  expect(
    await sendPayload(
      config,
      payload,
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response('', { status: 503 })),
    ),
  ).toMatchObject({ kind: 'transient' });
  expect(
    await sendPayload(
      config,
      payload,
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response('', { status: 401 })),
    ),
  ).toMatchObject({ kind: 'permanent' });
  expect(
    await sendPayload(
      config,
      payload,
      vi.fn<typeof fetch>().mockResolvedValue(
        new Response('', {
          headers: { 'Retry-After': '12' },
          status: 429,
        }),
      ),
    ),
  ).toMatchObject({ kind: 'transient', retryAfterMs: 12_000 });
});

test('retry queue merges new directory hints without losing them', async () => {
  let resolveFirst: ((response: Response) => void) | undefined;
  const firstResponse = new Promise<Response>((resolve) => {
    resolveFirst = resolve;
  });
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockReturnValueOnce(firstResponse)
    .mockResolvedValue(new Response('', { status: 202 }));
  const delivery = createDeliveryService({
    config,
    fetchImpl,
    logger,
    onPermanentError: vi.fn(),
    protocol: createProtocolContext({ config, instanceId: 'instance-1' }),
    random: () => 0.5,
  });

  delivery.enqueueDirectories(['Archive/Studio/A']);
  await vi.waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(1));
  delivery.enqueueDirectories(['Archive/Studio/B']);
  resolveFirst?.(new Response('', { status: 503 }));
  await vi.runOnlyPendingTimersAsync();
  await vi.waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(2));

  expect(payloadForCall(fetchImpl, 1)['directories']).toEqual([
    'Archive/Studio/B',
    'Archive/Studio/A',
  ]);
  await delivery.shutdown();
});

test('exhausted directory retries collapse into one forced reconcile', async () => {
  const fetchImpl = vi.fn<typeof fetch>();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    fetchImpl.mockResolvedValueOnce(new Response('', { status: 503 }));
  }
  fetchImpl.mockResolvedValue(new Response('', { status: 202 }));
  const delivery = createDeliveryService({
    config,
    fetchImpl,
    logger,
    onPermanentError: vi.fn(),
    protocol: createProtocolContext({ config, instanceId: 'instance-1' }),
    random: () => 0.5,
  });

  delivery.enqueueDirectories([
    'Archive/Studio/Weddings/A',
    'Archive/Studio/Weddings/B',
  ]);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await vi.waitFor(() =>
      expect(fetchImpl).toHaveBeenCalledTimes(attempt + 1),
    );
    await vi.runOnlyPendingTimersAsync();
  }
  await vi.waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(6));

  expect(payloadForCall(fetchImpl, 5)).toMatchObject({
    reconcile: true,
    reconcileMode: 'force',
    reconcilePath: 'Archive/Studio/Weddings',
  });
  await delivery.shutdown();
});

test('permanent rejection updates health and stops delivery', async () => {
  const onPermanentError = vi.fn();
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockResolvedValue(new Response('', { status: 401 }));
  const delivery = createDeliveryService({
    config,
    fetchImpl,
    logger,
    onPermanentError,
    protocol: createProtocolContext({ config, instanceId: 'instance-1' }),
  });

  delivery.enqueueDirectories(['Archive/Studio/A']);
  await vi.waitFor(() => expect(onPermanentError).toHaveBeenCalledOnce());
  delivery.enqueueDirectories(['Archive/Studio/B']);

  expect(fetchImpl).toHaveBeenCalledOnce();
  await delivery.shutdown();
});

test('common ancestors never widen above the configured prefix', () => {
  expect(
    commonAncestor(
      ['Archive/Studio/A/One', 'Archive/Studio/B/Two'],
      'Archive/Studio',
    ),
  ).toBe('Archive/Studio');
});
