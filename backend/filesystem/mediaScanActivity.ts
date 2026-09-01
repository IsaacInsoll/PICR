import type { Task } from '@shared/gql/graphql.js';
import { MEDIA_SCAN_TASK_ID } from '@shared/tasks/mediaTaskIds.js';

export const MEDIA_SCAN_ACTIVITY_MIN_AGE_MS = 1_500;

const activeOperations = new Map<symbol, number>();
let now = Date.now;

export const withMediaScanActivity = async <T>(
  operation: () => Promise<T>,
): Promise<T> => {
  const token = Symbol('media-scan-operation');
  activeOperations.set(token, now());
  try {
    return await operation();
  } finally {
    activeOperations.delete(token);
  }
};

export const mediaScanTaskStatus = (): Task | null => {
  const currentTime = now();
  const hasSubstantiveOperation = [...activeOperations.values()].some(
    (startedAt) => currentTime - startedAt >= MEDIA_SCAN_ACTIVITY_MIN_AGE_MS,
  );
  if (!hasSubstantiveOperation) return null;

  return {
    id: MEDIA_SCAN_TASK_ID,
    name: 'Checking for new media…',
  };
};

export const resetMediaScanActivityForTests = (
  testNow: () => number = Date.now,
): void => {
  activeOperations.clear();
  now = testNow;
};
