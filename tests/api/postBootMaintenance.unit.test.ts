import { afterEach, expect, test, vi } from 'vitest';

const context = {
  currentVersion: '1.4.0',
  previousBootedVersion: '1.3.6',
};

const noBackfillWork = {
  backfilled: 0,
  failed: 0,
  skippedMissing: 0,
};

const loadPostBootMaintenance = async ({
  backfillImageDimensionsImpl = async () => noBackfillWork,
}: {
  backfillImageDimensionsImpl?: () => Promise<unknown>;
} = {}) => {
  vi.resetModules();
  const backfillImageDimensions = vi.fn(backfillImageDimensionsImpl);
  const log = vi.fn();

  vi.doMock('../../backend/boot/backfillImageDimensions.js', () => ({
    backfillImageDimensions,
  }));
  vi.doMock('../../backend/logger.js', () => ({ log }));

  const { postBootMaintenance } =
    await import('../../backend/boot/postBootMaintenance.js');

  return { backfillImageDimensions, log, postBootMaintenance };
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

test('runs image dimension backfill during post-boot maintenance without logging no-op work', async () => {
  const { backfillImageDimensions, log, postBootMaintenance } =
    await loadPostBootMaintenance();

  await postBootMaintenance(context);

  expect(backfillImageDimensions).toHaveBeenCalledOnce();
  expect(log).not.toHaveBeenCalled();
});

test('logs post-boot maintenance completion when a task did work', async () => {
  const { log, postBootMaintenance } = await loadPostBootMaintenance({
    backfillImageDimensionsImpl: async () => ({
      backfilled: 12,
      failed: 0,
      skippedMissing: 1,
    }),
  });

  await postBootMaintenance(context);

  expect(log).toHaveBeenCalledWith(
    'info',
    expect.stringContaining('Post-boot maintenance complete'),
    true,
  );
});

test('logs and continues when post-boot maintenance fails', async () => {
  const { log, postBootMaintenance } = await loadPostBootMaintenance({
    backfillImageDimensionsImpl: async () => {
      throw new Error('db disconnected');
    },
  });

  await expect(postBootMaintenance(context)).resolves.toBeUndefined();
  expect(log).toHaveBeenCalledWith(
    'error',
    expect.stringContaining('Post-boot maintenance failed after'),
    true,
  );
});
