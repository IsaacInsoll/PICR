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

const noDerivedFieldsWork = {
  capturedAtBackfilled: 0,
  malformedCaptureDates: 0,
  searchFieldsBackfilled: 0,
};

const loadPostBootMaintenance = async ({
  backfillImageDimensionsImpl = async () => noBackfillWork,
  backfillFileDerivedFieldsImpl = async () => noDerivedFieldsWork,
}: {
  backfillImageDimensionsImpl?: () => Promise<unknown>;
  backfillFileDerivedFieldsImpl?: () => Promise<unknown>;
} = {}) => {
  vi.resetModules();
  const backfillImageDimensions = vi.fn(backfillImageDimensionsImpl);
  const backfillFileDerivedFields = vi.fn(backfillFileDerivedFieldsImpl);
  const log = vi.fn();

  vi.doMock('../../backend/boot/backfillImageDimensions.js', () => ({
    backfillImageDimensions,
  }));
  vi.doMock('../../backend/boot/backfillFileDerivedFields.js', () => ({
    backfillFileDerivedFields,
  }));
  vi.doMock('../../backend/logger.js', () => ({ log }));

  const { postBootMaintenance } =
    await import('../../backend/boot/postBootMaintenance.js');

  return {
    backfillFileDerivedFields,
    backfillImageDimensions,
    log,
    postBootMaintenance,
  };
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

test('runs post-boot backfills in order without logging no-op work', async () => {
  const order: string[] = [];
  const {
    backfillFileDerivedFields,
    backfillImageDimensions,
    log,
    postBootMaintenance,
  } = await loadPostBootMaintenance({
    backfillImageDimensionsImpl: async () => {
      order.push('dimensions');
      return noBackfillWork;
    },
    backfillFileDerivedFieldsImpl: async () => {
      order.push('derived-fields');
      return noDerivedFieldsWork;
    },
  });

  await postBootMaintenance(context);

  expect(backfillImageDimensions).toHaveBeenCalledOnce();
  expect(backfillFileDerivedFields).toHaveBeenCalledOnce();
  expect(order).toEqual(['derived-fields', 'dimensions']);
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

test('does not log overall completion for malformed-only capture metadata', async () => {
  const { log, postBootMaintenance } = await loadPostBootMaintenance({
    backfillFileDerivedFieldsImpl: async () => ({
      ...noDerivedFieldsWork,
      malformedCaptureDates: 1,
    }),
  });

  await postBootMaintenance(context);

  expect(log).not.toHaveBeenCalled();
});

test('logs an isolated task failure and continues with later maintenance', async () => {
  const { backfillImageDimensions, log, postBootMaintenance } =
    await loadPostBootMaintenance({
      backfillFileDerivedFieldsImpl: async () => {
        throw new Error('db disconnected');
      },
    });

  await expect(postBootMaintenance(context)).resolves.toBeUndefined();
  expect(backfillImageDimensions).toHaveBeenCalledOnce();
  expect(log).toHaveBeenCalledWith(
    'error',
    expect.stringContaining(
      'maintenance task file derived-fields backfill failed',
    ),
    true,
  );
});

test('continues startup when the final maintenance task fails', async () => {
  const { log, postBootMaintenance } = await loadPostBootMaintenance({
    backfillImageDimensionsImpl: async () => {
      throw new Error('db disconnected');
    },
  });

  await expect(postBootMaintenance(context)).resolves.toBeUndefined();
  expect(log).toHaveBeenCalledWith(
    'error',
    expect.stringContaining('maintenance task image dimension backfill failed'),
    true,
  );
});
