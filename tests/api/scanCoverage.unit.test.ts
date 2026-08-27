import { afterEach, expect, test } from 'vitest';
import {
  getLastSuccessfulFullLibraryScan,
  recordSuccessfulFullLibraryScan,
  resetScanCoverageForTests,
} from '../../backend/filesystem/scanCoverage.js';

afterEach(resetScanCoverageForTests);

test('records scan start and completion independently', () => {
  const startedAt = new Date('2026-08-26T00:00:00.000Z');
  const completedAt = new Date('2026-08-26T00:02:00.000Z');

  recordSuccessfulFullLibraryScan(startedAt, completedAt);

  expect(getLastSuccessfulFullLibraryScan()).toEqual({
    startedAt,
    completedAt,
  });
});
