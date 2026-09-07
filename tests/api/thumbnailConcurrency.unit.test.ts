import { afterEach, expect, test, vi } from 'vitest';

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
};

const tick = async () => {
  for (let i = 0; i < 10; i++) await Promise.resolve();
};

const loadConcurrency = async (thumbnailWorkerCount: number) => {
  vi.resetModules();
  vi.doMock('../../backend/config/picrConfig.js', () => ({
    picrConfig: { thumbnailWorkerCount },
  }));
  return import('../../backend/media/thumbnailConcurrency.js');
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  vi.useRealTimers();
});

test('never runs more work than the configured worker count', async () => {
  const { withThumbnailSlot } = await loadConcurrency(2);
  const gate = deferred();
  let active = 0;
  let peak = 0;

  const runs = Array.from({ length: 8 }, () =>
    withThumbnailSlot('background', async () => {
      active++;
      peak = Math.max(peak, active);
      await gate.promise;
      active--;
    }),
  );

  await tick();
  expect(peak).toBe(2);

  gate.resolve();
  await Promise.all(runs);
  expect(peak).toBe(2);
});

test('interactive work jumps ahead of queued background work', async () => {
  const { withThumbnailSlot } = await loadConcurrency(1);
  const gate = deferred();
  const order: string[] = [];

  const blocker = withThumbnailSlot('background', async () => {
    order.push('blocker');
    await gate.promise;
  });
  await tick();

  const queued = [
    withThumbnailSlot('background', async () => {
      order.push('background-1');
    }),
    withThumbnailSlot('background', async () => {
      order.push('background-2');
    }),
    withThumbnailSlot('interactive', async () => {
      order.push('interactive');
    }),
  ];

  gate.resolve();
  await Promise.all([blocker, ...queued]);

  // The interactive waiter arrived last but is served first: a viewer waiting
  // on a visible thumbnail should not sit behind a whole-library warm-up.
  expect(order).toEqual([
    'blocker',
    'interactive',
    'background-1',
    'background-2',
  ]);
});

test('background work waits indefinitely rather than giving up its place', async () => {
  const { withThumbnailSlot, thumbnailSlotStats } = await loadConcurrency(1);
  const gate = deferred();

  const blocker = withThumbnailSlot('background', () => gate.promise);
  await tick();

  let finished = false;
  const queued = withThumbnailSlot('background', async () => {
    finished = true;
  });

  await tick();
  expect(finished).toBe(false);
  expect(thumbnailSlotStats()).toMatchObject({ active: 1, waiting: 1 });

  gate.resolve();
  await Promise.all([blocker, queued]);
  expect(finished).toBe(true);
});

test('a slot is released even when the work throws', async () => {
  const { withThumbnailSlot, thumbnailSlotStats } = await loadConcurrency(1);

  await expect(
    withThumbnailSlot('background', async () => {
      throw new Error('decode failed');
    }),
  ).rejects.toThrow('decode failed');

  expect(thumbnailSlotStats()).toMatchObject({ active: 0, waiting: 0 });
});
