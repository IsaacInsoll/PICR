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
  {
    onGenerateAllThumbs,
    thumbnailWorkerCount = 2,
  }: {
    onGenerateAllThumbs?: (file: { id: number }) => Promise<void> | void;
    thumbnailWorkerCount?: number;
  } = {},
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
  const generateAllThumbs = vi.fn(async (file: { id: number }) => {
    calls.push(`thumb:${file.id}:start`);
    await onGenerateAllThumbs?.(file);
    calls.push(`thumb:${file.id}:end`);
  });
  const log = vi.fn();

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
    generateAllThumbs,
  }));
  vi.doMock('../../backend/logger.js', () => ({ log }));
  vi.doMock('../../backend/config/picrConfig.js', () => ({
    picrConfig: { thumbnailWorkerCount },
  }));
  vi.doMock('../../backend/db/picrDb.js', () => ({
    db: {},
    dbFileForId: vi.fn(async (id: number) => ({ id })),
  }));

  const fileQueue = await import('../../backend/filesystem/fileQueue.js');

  return {
    addFile,
    calls,
    fileQueue,
    generateAllThumbs,
    log,
    removeFile,
  };
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

test('priority queue items wait for the running task before starting', async () => {
  const firstAdd = deferred();
  const { addFile, fileQueue, removeFile } = await loadFileQueue(
    async (path) => {
      if (path === mediaPath('first.jpg')) await firstAdd.promise;
    },
  );

  fileQueue.addToQueue('add', { path: mediaPath('first.jpg') });
  await waitFor(() => addFile.mock.calls.length === 1);
  expect(fileQueue.queueTaskStatus()).toMatchObject({
    id: 'media-import',
    step: 0,
  });

  fileQueue.addToQueue('unlink', { path: mediaPath('priority.jpg') }, true);

  expect(removeFile).not.toHaveBeenCalled();

  firstAdd.resolve();
  await waitFor(() => removeFile.mock.calls.length === 1);

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
  await waitFor(() => calls.length === 1);

  firstAdd.resolve();
  await waitFor(() => calls.length === 3);

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
  await waitFor(() => addFile.mock.calls.length === 1);

  firstAdd.resolve();
  await waitFor(() => addFile.mock.calls.length === 2);

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
  await waitFor(() => calls.length === 1);

  firstAdd.resolve();
  await waitFor(() => calls.length === 3);

  expect(calls).toEqual([
    `add:${mediaPath('first.jpg')}:false`,
    `unlink:${mediaPath('recreated.jpg')}`,
    `add:${mediaPath('recreated.jpg')}:false`,
  ]);
});

test('generateThumbnails items run concurrently up to the configured worker count', async () => {
  const firstAdd = deferred();
  const releases = new Map<number, ReturnType<typeof deferred>>();
  const started: number[] = [];
  const { fileQueue, generateAllThumbs } = await loadFileQueue(
    async (path) => {
      if (path === mediaPath('first.jpg')) await firstAdd.promise;
    },
    {
      thumbnailWorkerCount: 2,
      onGenerateAllThumbs: async ({ id }) => {
        started.push(id);
        const release = deferred();
        releases.set(id, release);
        await release.promise;
      },
    },
  );

  fileQueue.addToQueue('add', { path: mediaPath('first.jpg') });
  fileQueue.addToQueue('generateThumbnails', { id: 1 });
  fileQueue.addToQueue('generateThumbnails', { id: 2 });
  fileQueue.addToQueue('generateThumbnails', { id: 3 });

  await waitFor(() => generateAllThumbs.mock.calls.length === 0);
  firstAdd.resolve();
  await waitFor(() => started.length === 2);
  expect(started).toEqual([1, 2]);
  expect(generateAllThumbs).toHaveBeenCalledTimes(2);

  releases.get(1)?.resolve();
  releases.get(2)?.resolve();
  await waitFor(() => started.length === 3);
  expect(started).toEqual([1, 2, 3]);

  releases.get(3)?.resolve();
  await waitFor(() => fileQueue.queueTaskStatus() === null);
});

test('generateThumbnails batching does not skip over serial filesystem work', async () => {
  const firstAdd = deferred();
  const thumbnailRelease = deferred();
  const { calls, fileQueue } = await loadFileQueue(
    async (path) => {
      if (path === mediaPath('first.jpg')) await firstAdd.promise;
    },
    {
      thumbnailWorkerCount: 2,
      onGenerateAllThumbs: async () => {
        await thumbnailRelease.promise;
      },
    },
  );

  fileQueue.addToQueue('add', { path: mediaPath('first.jpg') });
  fileQueue.addToQueue('generateThumbnails', { id: 1 });
  fileQueue.addToQueue('add', { path: mediaPath('between.jpg') });
  fileQueue.addToQueue('generateThumbnails', { id: 2 });

  await waitFor(() => calls.length === 1);
  expect(calls).toEqual([`add:${mediaPath('first.jpg')}:false`]);

  firstAdd.resolve();
  await waitFor(() => calls.includes('thumb:1:start'));
  expect(calls).not.toContain(`add:${mediaPath('between.jpg')}:false`);
  expect(calls).not.toContain('thumb:2:start');

  thumbnailRelease.resolve();
  await waitFor(() => fileQueue.queueTaskStatus() === null);
  expect(calls).toEqual([
    `add:${mediaPath('first.jpg')}:false`,
    'thumb:1:start',
    'thumb:1:end',
    `add:${mediaPath('between.jpg')}:false`,
    'thumb:2:start',
    'thumb:2:end',
  ]);
});
