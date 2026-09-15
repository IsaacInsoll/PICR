import { MantineProvider } from '@mantine/core';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import {
  determinateTaskProgress,
  mediaTaskTranslationKey,
  pendingZipOutcome,
  TaskProgress,
} from './TaskSummary.js';
import type { PendingZipDownload } from './DownloadZipButton.js';

const renderProgress = (props: Parameters<typeof TaskProgress>[0]): string =>
  renderToStaticMarkup(
    <MantineProvider>
      <TaskProgress {...props} />
    </MantineProvider>,
  );

test('zero completed steps render determinate progress with an accessible label', () => {
  expect(determinateTaskProgress(0, 4)).toEqual({ step: 0, totalSteps: 4 });

  const html = renderProgress({
    name: 'Import files',
    step: 0,
    totalSteps: 4,
  });

  expect(html).toContain('role="progressbar"');
  expect(html).toContain('aria-label="Import files"');
  expect(html).toContain('aria-valuenow="0"');
  expect(html).toContain('0/4');
});

test('tasks without steps render the indeterminate loader', () => {
  expect(determinateTaskProgress(undefined, undefined)).toBeNull();

  const html = renderProgress({ name: 'Checking for new media' });

  expect(html).not.toContain('role="progressbar"');
  expect(html).toContain('mantine-Loader-root');
});

test('known backend task IDs select translated labels', () => {
  expect(mediaTaskTranslationKey('image-dimension-backfill')).toBe(
    'task.imageDimensionBackfill',
  );
  expect(mediaTaskTranslationKey('media-scan')).toBe('task.mediaScan');
  expect(mediaTaskTranslationKey('media-import')).toBe('task.mediaImport');
  expect(mediaTaskTranslationKey('file-derived-fields-backfill')).toBe(
    'task.searchPreparation',
  );
  expect(mediaTaskTranslationKey('zip-task')).toBeNull();
});

const pendingZip: PendingZipDownload = {
  folder: { id: '7', name: 'Smith Wedding' },
  hash: 'abc',
  requestedAt: 1_000,
};
const zipTask = (status: string) => [{ id: '7abc', status }];

test('a pending ZIP downloads once its task completes', () => {
  expect(pendingZipOutcome(pendingZip, zipTask('Complete'), null)).toBe(
    'complete',
  );
  expect(pendingZipOutcome(pendingZip, zipTask('In Progress'), 2_000)).toBe(
    'pending',
  );
  expect(pendingZipOutcome(pendingZip, [], 2_000)).toBe('pending');
});

test('a ZIP failure is only trusted from a task request started after the ZIP request', () => {
  // A task request started after the ZIP request reports this attempt's failure.
  expect(pendingZipOutcome(pendingZip, zipTask('Error'), 2_000)).toBe('failed');
  // Cached data, or an in-flight request started before the retry, can still
  // hold the previous attempt's Error.
  expect(pendingZipOutcome(pendingZip, zipTask('Error'), 900)).toBe('pending');
  expect(pendingZipOutcome(pendingZip, zipTask('Error'), null)).toBe('pending');
});
