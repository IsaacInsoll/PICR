import { MantineProvider } from '@mantine/core';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, test, vi } from 'vitest';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import type * as Urql from 'urql';
import type * as Jotai from 'jotai';
import galleryEnglish from '@shared/i18n/locales/en/gallery.json';
import {
  determinateTaskProgress,
  mediaTaskTranslationKey,
  TaskProgress,
  ZipTaskError,
  TaskSummary,
} from './TaskSummary.js';

const queryState = vi.hoisted(() => ({
  tasks: [] as {
    id: string;
    name: string;
    status: string;
    errorCode?: string;
  }[],
  pending: [] as { folder: { id: string; name: string }; hash: string }[],
}));
vi.mock('urql', async (importOriginal) => ({
  ...(await importOriginal<typeof Urql>()),
  useQuery: () => [{ data: { tasks: queryState.tasks } }, vi.fn()],
}));
vi.mock('jotai', async (importOriginal) => ({
  ...(await importOriginal<typeof Jotai>()),
  useAtom: () => [queryState.pending, vi.fn()],
}));
afterEach(() => {
  queryState.tasks = [];
  queryState.pending = [];
});

const testI18n = createInstance();
await testI18n.init({
  lng: 'en',
  resources: { en: { gallery: galleryEnglish } },
});

const renderSummary = () =>
  renderToStaticMarkup(
    <I18nextProvider i18n={testI18n}>
      <MantineProvider>
        <TaskSummary folderId="2" />
      </MantineProvider>
    </I18nextProvider>,
  );

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

test('another viewer does not see a failed ZIP or an empty task panel', () => {
  queryState.tasks = [
    {
      id: '2hash',
      name: 'Zip RAW Gallery',
      status: 'Error',
      errorCode: 'NO_SPACE',
    },
  ];
  expect(renderSummary()).not.toContain('Zip RAW Gallery');
  expect(renderSummary()).not.toContain('mantine-Alert-root');
  expect(renderSummary()).not.toContain('mantine-Paper-root');
});

test('only the requested hash shows an error, and clearing the pending download hides it', () => {
  queryState.tasks = [
    {
      id: '2old',
      name: 'Zip old contents',
      status: 'Error',
      errorCode: 'FILE_MISSING',
    },
    {
      id: '2current',
      name: 'Zip RAW Gallery',
      status: 'Error',
      errorCode: 'NO_SPACE',
    },
  ];
  queryState.pending = [
    { folder: { id: '2', name: 'RAW Gallery' }, hash: 'current' },
  ];
  const html = renderSummary();
  expect(html).toContain('RAW Gallery');
  expect(html).toContain(galleryEnglish.download.zipError.noSpace);
  expect(html).not.toContain(galleryEnglish.download.zipError.fileMissing);
  expect(html).not.toContain('Zip old contents');
  expect(html).toContain('aria-label="Close warning"');
  queryState.pending = [];
  expect(renderSummary()).not.toContain('mantine-Alert-root');
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
  expect(mediaTaskTranslationKey('zip-task')).toBeNull();
});

test('failed ZIPs show a reason without a progress spinner, including unknown errors', () => {
  const renderError = (errorCode: string) =>
    renderToStaticMarkup(
      <MantineProvider>
        <ZipTaskError name="RAW Gallery" errorCode={errorCode} />
      </MantineProvider>,
    );
  const full = renderError('NO_SPACE');
  expect(full).toContain('RAW Gallery');
  expect(full).toContain('download.zipError.noSpace');
  expect(full).not.toContain('mantine-Loader-root');
  expect(full).not.toContain('role="progressbar"');
  expect(renderError('FUTURE_ERROR')).toContain('download.zipError.generic');
});
