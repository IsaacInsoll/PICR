import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { createDirectoryBatcher } from '../src/batcher.js';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

test('dedupes directories and flushes continuously without waiting for quiet', async () => {
  const onFlush = vi.fn();
  const batcher = createDirectoryBatcher({
    batchMs: 1000,
    maxDirectories: 1000,
    onFlush,
  });

  batcher.add(['A', 'A']);
  await vi.advanceTimersByTimeAsync(900);
  batcher.add(['B']);
  await vi.advanceTimersByTimeAsync(100);

  expect(onFlush).toHaveBeenCalledWith(['A', 'B']);
  await batcher.close();
});

test('flushes immediately at maximum batch size', async () => {
  const onFlush = vi.fn();
  const batcher = createDirectoryBatcher({
    batchMs: 1000,
    maxDirectories: 2,
    onFlush,
  });

  batcher.add(['A', 'B']);
  await vi.advanceTimersByTimeAsync(0);

  expect(onFlush).toHaveBeenCalledWith(['A', 'B']);
  await batcher.close();
});

test('unlink grace coalesces a source with a delayed destination add', async () => {
  const onFlush = vi.fn();
  const batcher = createDirectoryBatcher({
    batchMs: 1000,
    maxDirectories: 1000,
    onFlush,
  });

  batcher.add(['Source'], 3000);
  await vi.advanceTimersByTimeAsync(2000);
  batcher.add(['Destination']);
  await vi.advanceTimersByTimeAsync(1000);

  expect(onFlush).toHaveBeenCalledWith(
    expect.arrayContaining(['Source', 'Destination']),
  );
  expect(onFlush.mock.calls[0]?.[0]).toHaveLength(2);
  await batcher.close();
});

test('a direct event promotes a held directory without duplicating it', async () => {
  const onFlush = vi.fn();
  const batcher = createDirectoryBatcher({
    batchMs: 1000,
    maxDirectories: 1000,
    onFlush,
  });

  batcher.add(['Same'], 3000);
  batcher.add(['Same']);
  await vi.advanceTimersByTimeAsync(1000);

  expect(onFlush).toHaveBeenCalledWith(['Same']);
  await batcher.close();
});
