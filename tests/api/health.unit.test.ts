import type { RequestHandler } from 'express';
import { afterEach, expect, test, vi } from 'vitest';

type MockResponse = {
  body: unknown;
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
};

const createMockResponse = (): MockResponse => {
  const response = {
    body: undefined as unknown,
    status: vi.fn(),
    json: vi.fn(),
  };

  response.status.mockReturnValue(response);
  response.json.mockImplementation((body: unknown) => {
    response.body = body;
    return response;
  });

  return response;
};

const runHandler = async (handler: RequestHandler, response: MockResponse) => {
  await handler(
    {} as Parameters<RequestHandler>[0],
    response as unknown as Parameters<RequestHandler>[1],
    vi.fn(),
  );
};

const loadHealth = async () => {
  vi.resetModules();
  vi.doMock('../../backend/db/picrDb.js', () => ({
    db: { execute: vi.fn() },
  }));
  return import('../../backend/express/health.js');
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

test('/healthz returns ok', async () => {
  const { healthz } = await loadHealth();
  const response = createMockResponse();

  await runHandler(healthz, response);

  expect(response.status).toHaveBeenCalledWith(200);
  expect(response.json).toHaveBeenCalledWith({ status: 'ok' });
});

test('/readyz returns ok when the database check succeeds', async () => {
  const { createReadyz } = await loadHealth();
  const execute = vi.fn().mockResolvedValue([]);
  const response = createMockResponse();

  await runHandler(createReadyz({ execute }), response);

  expect(execute).toHaveBeenCalledOnce();
  expect(response.status).toHaveBeenCalledWith(200);
  expect(response.json).toHaveBeenCalledWith({ status: 'ok' });
});

test('/readyz returns unhealthy when the database check fails', async () => {
  const { createReadyz } = await loadHealth();
  const execute = vi.fn().mockRejectedValue(new Error('database unavailable'));
  const response = createMockResponse();

  await runHandler(createReadyz({ execute }), response);

  expect(execute).toHaveBeenCalledOnce();
  expect(response.status).toHaveBeenCalledWith(503);
  expect(response.json).toHaveBeenCalledWith({ status: 'unhealthy' });
});
