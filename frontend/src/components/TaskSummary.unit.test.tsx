import { MantineProvider } from '@mantine/core';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import {
  determinateTaskProgress,
  mediaTaskTranslationKey,
  TaskProgress,
} from './TaskSummary.js';

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
  expect(mediaTaskTranslationKey('media-scan')).toBe('task.mediaScan');
  expect(mediaTaskTranslationKey('media-import')).toBe('task.mediaImport');
  expect(mediaTaskTranslationKey('zip-task')).toBeNull();
});
