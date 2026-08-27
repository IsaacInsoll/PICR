import { expect, test, vi } from 'vitest';
import { closeWatcherAfterError, watchCounts } from '../src/watcher.js';

test('watch counts exclude the parent entry outside WATCH_ROOT', () => {
  expect(
    watchCounts(
      {
        '/volume/photos': ['media'],
        '/volume/photos/media': ['one', 'root.jpg', 'two'],
        '/volume/photos/media/one': ['one.jpg'],
        '/volume/photos/media/two': ['nested'],
        '/volume/photos/media/two/nested': ['two.jpg'],
      },
      '/volume/photos/media',
    ),
  ).toEqual({ directories: 4, entries: 6 });
});

test('a startup watcher error closes its resource before fatal shutdown', async () => {
  const order: string[] = [];
  const error = new Error('EMFILE');
  const onError = vi.fn(() => order.push('error'));

  await closeWatcherAfterError(
    { close: vi.fn(async () => void order.push('closed')) },
    error,
    onError,
  );

  expect(order).toEqual(['closed', 'error']);
  expect(onError).toHaveBeenCalledWith(error);
});
