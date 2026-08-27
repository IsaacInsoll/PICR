import type { NextFunction, Request, Response } from 'express';
import { afterEach, expect, test, vi } from 'vitest';
import { picrConfig } from '../../backend/config/picrConfig.js';
import {
  authenticatePing,
  createMediaChangedHandler,
  normalisePingPath,
  registerMediaChangedRoute,
} from '../../backend/express/mediaChanged.js';
import { resetPingAuthRateLimitForTests } from '../../backend/express/pingAuthRateLimit.js';
import {
  getPingStatus,
  recordSuccessfulPingReconcile,
  resetPingStatusForTests,
} from '../../backend/filesystem/pingStatus.js';
import {
  recordSuccessfulFullLibraryScan,
  resetScanCoverageForTests,
} from '../../backend/filesystem/scanCoverage.js';

const pingToken = 'a'.repeat(64);
const receivedAt = new Date('2026-08-26T00:10:00.000Z');

const basePayload = () => ({
  protocolVersion: 1,
  source: 'studio-nas',
  instanceId: 'instance-1',
  instanceUptimeMs: 600_000,
  watcherReadyUptimeMs: 300_000,
  watchPrefix: 'Archive/Studio',
});

const mockResponse = () => {
  const response = {
    body: undefined as unknown,
    headers: new Map<string, string>(),
    statusCode: 200,
  };
  const api = {
    json: vi.fn((body: unknown) => {
      response.body = body;
      return api;
    }),
    setHeader: vi.fn((name: string, value: string) => {
      response.headers.set(name, value);
      return api;
    }),
    status: vi.fn((statusCode: number) => {
      response.statusCode = statusCode;
      return api;
    }),
  };
  return { api: api as unknown as Response, response };
};

const runHandler = async (
  body: unknown,
  overrides: {
    coordinator?: {
      enqueueDirectories: ReturnType<typeof vi.fn>;
      enqueueReconcile: ReturnType<typeof vi.fn>;
    };
    pingVersion?: string;
    probePath?: (path: string) => Promise<'ignored' | 'missing' | 'visible'>;
  } = {},
) => {
  const coordinator = overrides.coordinator ?? {
    enqueueDirectories: vi.fn(async () => undefined),
    enqueueReconcile: vi.fn(async () => undefined),
  };
  const handler = createMediaChangedHandler({
    coordinator,
    now: () => receivedAt,
    probePath: overrides.probePath ?? vi.fn(async () => 'visible'),
  });
  const request = {
    body,
    get: (name: string) =>
      name.toLowerCase() === 'x-picr-ping-version'
        ? (overrides.pingVersion ?? '0.1.0')
        : undefined,
  } as Request;
  const { api, response } = mockResponse();
  await handler(request, api, vi.fn() as NextFunction);
  return { coordinator, response };
};

afterEach(() => {
  picrConfig.pingToken = undefined;
  resetPingAuthRateLimitForTests();
  resetPingStatusForTests();
  resetScanCoverageForTests();
  vi.restoreAllMocks();
});

test.each(['../escape', '/absolute', 'bad\\path', 'bad\0path', 'a//b'])(
  'rejects unsafe directory %s without enqueueing any part of the batch',
  async (unsafePath) => {
    const { coordinator, response } = await runHandler({
      ...basePayload(),
      directories: ['Archive/Studio/valid', unsafePath],
      reconcile: false,
    });

    expect(response.statusCode).toBe(400);
    expect(response.body).toMatchObject({ code: 'INVALID_PAYLOAD' });
    expect(coordinator.enqueueDirectories).not.toHaveBeenCalled();
  },
);

test('accepts spaces and Unicode while counting ignored directories separately', async () => {
  const { coordinator, response } = await runHandler({
    ...basePayload(),
    directories: [
      'Archive/Studio/Weddings/Élodie and 李',
      'Archive/Studio/@eaDir',
    ],
    reconcile: false,
  });

  expect(response.statusCode).toBe(202);
  expect(response.body).toEqual({ accepted: 1, ignored: 1 });
  expect(coordinator.enqueueDirectories).toHaveBeenCalledWith([
    'Archive/Studio/Weddings/Élodie and 李',
  ]);
});

test('rejects the whole request when any path escapes watchPrefix', async () => {
  const { coordinator, response } = await runHandler({
    ...basePayload(),
    directories: ['Archive/Other'],
    reconcile: false,
  });

  expect(response.statusCode).toBe(400);
  expect(coordinator.enqueueDirectories).not.toHaveBeenCalled();
  expect(
    getPingStatus(false, {
      foldersScanned: 0,
      lastError: null,
      pendingFolders: 0,
      state: 'idle',
    }).sources,
  ).toEqual([]);
});

test('returns a typed protocol-version error', async () => {
  const { response } = await runHandler({
    ...basePayload(),
    protocolVersion: 2,
    directories: [],
    reconcile: false,
  });

  expect(response.statusCode).toBe(400);
  expect(response.body).toEqual({
    error: 'Unsupported PICR Ping protocol version',
    code: 'UNSUPPORTED_PROTOCOL_VERSION',
    supportedProtocolVersions: [1],
  });
});

test('a probe reports visibility without enqueueing scan work', async () => {
  const probePath = vi.fn(async () => 'visible' as const);
  const { coordinator, response } = await runHandler(
    {
      ...basePayload(),
      probePath: 'Archive/Studio/IMG 001.CR3',
    },
    { probePath },
  );

  expect(response.statusCode).toBe(200);
  expect(response.body).toEqual({ probe: 'visible' });
  expect(probePath).toHaveBeenCalledWith('Archive/Studio/IMG 001.CR3');
  expect(coordinator.enqueueDirectories).not.toHaveBeenCalled();
  expect(coordinator.enqueueReconcile).not.toHaveBeenCalled();
});

test('a probe rejects change fields instead of silently ignoring them', async () => {
  const { response } = await runHandler({
    ...basePayload(),
    probePath: 'Archive/Studio/IMG.CR3',
    directories: [],
    reconcile: false,
  });

  expect(response.statusCode).toBe(400);
  expect(response.body).toMatchObject({ code: 'INVALID_PAYLOAD' });
});

test('auto reconcile skips only a covering scan that started after watcher ready', async () => {
  recordSuccessfulFullLibraryScan(
    new Date('2026-08-26T00:06:00.000Z'),
    new Date('2026-08-26T00:09:00.000Z'),
  );
  const { coordinator, response } = await runHandler({
    ...basePayload(),
    directories: [],
    reconcile: true,
    reconcileMode: 'auto',
    reconcilePath: 'Archive/Studio',
  });

  expect(response.statusCode).toBe(202);
  expect(coordinator.enqueueReconcile).not.toHaveBeenCalled();
});

test('scan completion after watcher ready does not cover an earlier scan start', async () => {
  recordSuccessfulFullLibraryScan(
    new Date('2026-08-26T00:04:00.000Z'),
    new Date('2026-08-26T00:09:00.000Z'),
  );
  const { coordinator } = await runHandler({
    ...basePayload(),
    directories: [],
    reconcile: true,
    reconcileMode: 'auto',
    reconcilePath: 'Archive/Studio',
  });

  expect(coordinator.enqueueReconcile).toHaveBeenCalledTimes(1);
});

test('force reconcile bypasses the recent-reconcile cooldown', async () => {
  await runHandler({
    ...basePayload(),
    directories: [],
    reconcile: false,
  });
  recordSuccessfulPingReconcile('studio-nas', 'Archive/Studio', {
    startedAt: new Date('2026-08-26T00:08:00.000Z'),
    completedAt: new Date('2026-08-26T00:09:00.000Z'),
  });
  const { coordinator } = await runHandler({
    ...basePayload(),
    directories: [],
    reconcile: true,
    reconcileMode: 'force',
    reconcilePath: 'Archive/Studio',
  });

  expect(coordinator.enqueueReconcile).toHaveBeenCalledTimes(1);
});

test('wrong-length credentials return 401 without timingSafeEqual throwing', async () => {
  picrConfig.pingToken = pingToken;
  const request = {
    get: () => 'Bearer short',
    ip: '127.0.0.1',
    socket: {},
  } as Request;
  const { api, response } = mockResponse();
  const next = vi.fn();

  authenticatePing(request, api, next);

  expect(response.statusCode).toBe(401);
  expect(next).not.toHaveBeenCalled();
});

test('valid credentials are never blocked by the failed-auth limiter', () => {
  picrConfig.pingToken = pingToken;
  const { api } = mockResponse();
  for (let attempt = 0; attempt < 11; attempt++) {
    authenticatePing(
      {
        get: () => 'Bearer wrong',
        ip: '127.0.0.1',
        socket: {},
      } as Request,
      api,
      vi.fn(),
    );
  }
  const next = vi.fn();

  authenticatePing(
    {
      get: () => `Bearer ${pingToken}`,
      ip: '127.0.0.1',
      socket: {},
    } as Request,
    api,
    next,
  );

  expect(next).toHaveBeenCalledOnce();
});

test('does not register the endpoint when the server token is unset', () => {
  const router = { post: vi.fn() };
  registerMediaChangedRoute(router as never);
  expect(router.post).not.toHaveBeenCalled();
});

test('path limits count Unicode characters rather than UTF-16 code units', () => {
  expect(normalisePingPath('😀'.repeat(255), 'directory', 255)).toHaveLength(
    510,
  );
  expect(() => normalisePingPath('😀'.repeat(256), 'directory', 255)).toThrow(
    'at most 255 characters',
  );
});
