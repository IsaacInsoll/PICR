import { afterEach, expect, test, vi } from 'vitest';

const mediaPath = (name: string) => `/media/${name}`;

const waitFor = async (predicate: () => boolean) => {
  for (let i = 0; i < 50; i++) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  throw new Error('Timed out waiting for queue condition');
};

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
};

const loadFileQueue = async (
  onAddFile?: (path: string, generateThumbs: boolean) => Promise<void> | void,
) => {
  vi.resetModules();

  const calls: string[] = [];
  const addFile = vi.fn(async (path: string, generateThumbs: boolean) => {
    calls.push(`add:${path}:${String(generateThumbs)}`);
    await onAddFile?.(path, generateThumbs);
  });
  const removeFile = vi.fn(async (path: string) => {
    calls.push(`unlink:${path}`);
  });

  vi.doMock('../../backend/filesystem/events/addFile.js', () => ({ addFile }));
  vi.doMock('../../backend/filesystem/events/addFolder.js', () => ({
    addFolder: vi.fn(),
  }));
  vi.doMock('../../backend/filesystem/events/removeFolder.js', () => ({
    removeFolder: vi.fn(),
  }));
  vi.doMock('../../backend/filesystem/events/renameFolder.js', () => ({
    renameFolder: vi.fn(),
  }));
  vi.doMock('../../backend/filesystem/events/removeFile.js', () => ({
    removeFile,
  }));
  vi.doMock('../../backend/media/generateImageThumbnail.js', () => ({
    generateAllThumbs: vi.fn(),
  }));
  vi.doMock('../../backend/logger.js', () => ({ log: vi.fn() }));
  vi.doMock('../../backend/db/picrDb.js', () => ({
    db: {},
    dbFileForId: vi.fn(),
  }));

  const fileQueue = await import('../../backend/filesystem/fileQueue.js');

  return {
    addFile,
    calls,
    fileQueue,
    removeFile,
  };
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

test('priority queue items wait for the running task before starting', async () => {
  const firstAdd = deferred();
  const { fileQueue, removeFile } = await loadFileQueue(async (path) => {
    if (path === mediaPath('first.jpg')) await firstAdd.promise;
  });

  fileQueue.addToQueue('add', { path: mediaPath('first.jpg') });
  await waitFor(() => fileQueue.queueTaskStatus()?.step === 0);

  fileQueue.addToQueue('unlink', { path: mediaPath('priority.jpg') }, true);

  expect(removeFile).not.toHaveBeenCalled();

  firstAdd.resolve();
  await waitFor(() => fileQueue.queueTaskStatus() === null);

  expect(removeFile).toHaveBeenCalledOnce();
  expect(removeFile).toHaveBeenCalledWith(mediaPath('priority.jpg'));
});

test('priority queue items run before regular pending items', async () => {
  const firstAdd = deferred();
  const { calls, fileQueue } = await loadFileQueue(async (path) => {
    if (path === mediaPath('first.jpg')) await firstAdd.promise;
  });

  fileQueue.addToQueue('add', { path: mediaPath('first.jpg') });
  fileQueue.addToQueue('add', { path: mediaPath('regular.jpg') });
  fileQueue.addToQueue('unlink', { path: mediaPath('priority.jpg') }, true);

  firstAdd.resolve();
  await waitFor(() => fileQueue.queueTaskStatus() === null);

  expect(calls).toEqual([
    `add:${mediaPath('first.jpg')}:false`,
    `unlink:${mediaPath('priority.jpg')}`,
    `add:${mediaPath('regular.jpg')}:false`,
  ]);
});

test('duplicate pending queue items are coalesced with the latest payload', async () => {
  const firstAdd = deferred();
  const { addFile, fileQueue } = await loadFileQueue(async (path) => {
    if (path === mediaPath('first.jpg')) await firstAdd.promise;
  });

  fileQueue.addToQueue('add', { path: mediaPath('first.jpg') });
  fileQueue.addToQueue('add', {
    path: mediaPath('duplicate.jpg'),
    generateThumbs: false,
  });
  fileQueue.addToQueue('add', {
    path: mediaPath('duplicate.jpg'),
    generateThumbs: true,
  });

  firstAdd.resolve();
  await waitFor(() => fileQueue.queueTaskStatus() === null);

  expect(addFile).toHaveBeenCalledTimes(2);
  expect(addFile).toHaveBeenNthCalledWith(
    2,
    mediaPath('duplicate.jpg'),
    true,
    undefined,
    undefined,
  );
});

test('coalesced queue items move after interleaved work so latest filesystem state wins', async () => {
  const firstAdd = deferred();
  const { calls, fileQueue } = await loadFileQueue(async (path) => {
    if (path === mediaPath('first.jpg')) await firstAdd.promise;
  });

  fileQueue.addToQueue('add', { path: mediaPath('first.jpg') });
  fileQueue.addToQueue('add', { path: mediaPath('recreated.jpg') });
  fileQueue.addToQueue('unlink', { path: mediaPath('recreated.jpg') });
  fileQueue.addToQueue('add', { path: mediaPath('recreated.jpg') });

  firstAdd.resolve();
  await waitFor(() => fileQueue.queueTaskStatus() === null);

  expect(calls).toEqual([
    `add:${mediaPath('first.jpg')}:false`,
    `unlink:${mediaPath('recreated.jpg')}`,
    `add:${mediaPath('recreated.jpg')}:false`,
  ]);
});
