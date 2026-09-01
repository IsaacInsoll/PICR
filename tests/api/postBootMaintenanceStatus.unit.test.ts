import { afterEach, expect, test } from 'vitest';
import {
  postBootMaintenanceTaskStatus,
  resetPostBootMaintenanceTaskStatusForTests,
  withPostBootMaintenanceTask,
} from '../../backend/boot/postBootMaintenanceStatus.js';

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
};

afterEach(() => {
  resetPostBootMaintenanceTaskStatusForTests();
});

test('reports active post-boot maintenance progress', async () => {
  const operation = deferred();
  const running = withPostBootMaintenanceTask(
    { id: 'image-dimension-backfill', name: 'Updating image dimensions' },
    async (progress) => {
      progress.setTotalSteps(3);
      progress.incrementStep();
      await operation.promise;
    },
  );

  expect(postBootMaintenanceTaskStatus()).toMatchObject({
    id: 'image-dimension-backfill',
    name: 'Updating image dimensions',
    step: 1,
    status: 'Running',
    totalSteps: 3,
  });

  operation.resolve();
  await running;
  expect(postBootMaintenanceTaskStatus()).toBeNull();
});

test('clears active post-boot maintenance after failure', async () => {
  await expect(
    withPostBootMaintenanceTask(
      { id: 'image-dimension-backfill', name: 'Updating image dimensions' },
      async () => {
        throw new Error('maintenance failed');
      },
    ),
  ).rejects.toThrow('maintenance failed');

  expect(postBootMaintenanceTaskStatus()).toBeNull();
});
