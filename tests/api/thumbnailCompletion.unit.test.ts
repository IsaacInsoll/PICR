import { afterEach, expect, test, vi } from 'vitest';
import { MediaTypeFilter } from '../../shared/gql/graphql';

interface MockThumbnailFile {
  fileHash: string | null;
  id: number;
  name: string;
  relativePath: string;
  type: 'Image' | 'Video';
}

const loadThumbnailCompletion = async ({
  files,
  entriesByRelativePath,
}: {
  files: MockThumbnailFile[];
  entriesByRelativePath: Record<string, readonly string[]>;
}) => {
  vi.resetModules();

  const findMany = vi.fn(async () => files);
  const allSubfolderIds = vi.fn(async () => [1, 2]);
  const entries = vi.fn(async (relativePath: string) =>
    (entriesByRelativePath[relativePath] ?? []).map((name) => ({
      isDirectory: false,
      isFile: true,
      name,
      path: relativePath,
    })),
  );
  const createThumbnailVariantIndex = vi.fn(() => ({ entries }));

  vi.doMock('../../backend/db/picrDb.js', () => ({
    db: { query: { dbFile: { findMany } } },
  }));
  vi.doMock('../../backend/helpers/allSubfolders.js', () => ({
    allSubfolderIds,
  }));
  vi.doMock('../../backend/filesystem/fileManager.js', () => ({
    fullPathForFile: vi.fn(
      (file: Pick<MockThumbnailFile, 'name' | 'relativePath'>) =>
        `/media/${file.relativePath}/${file.name}`,
    ),
    relativePath: vi.fn((path: string) => path.replace('/media/', '')),
  }));
  vi.doMock('../../backend/media/serverMediaSettings.js', () => ({
    getServerMediaSettings: vi.fn(async () => ({ thumbnailJpegQuality: 80 })),
  }));
  vi.doMock('../../backend/media/thumbnailVariants.js', () => ({
    createThumbnailVariantIndex,
  }));

  const module = await import('../../backend/media/thumbnailCompletion.js');
  return {
    allSubfolderIds,
    createThumbnailVariantIndex,
    entries,
    findMany,
    module,
  };
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

test('thumbnailCompletionForFolder counts complete and incomplete image variants', async () => {
  const { module } = await loadThumbnailCompletion({
    files: [file({ name: 'complete.jpg' }), file({ name: 'partial.jpg' })],
    entriesByRelativePath: {
      folder: [
        ...thumbnailVariantNames('complete.jpg'),
        'partial.jpg-v1-250j80-hash-a.jpg',
        'partial.jpg-v1-500j80-hash-a.jpg',
      ],
    },
  });

  await expect(
    module.thumbnailCompletionForFolder(folder(), MediaTypeFilter.Image),
  ).resolves.toEqual({
    totalFiles: 2,
    completeFiles: 1,
    incompleteFiles: 1,
    totalArtifacts: 16,
    missingArtifacts: 6,
  });
});

test('thumbnailCompletionForFolder includes video scrub and poster frame artifacts', async () => {
  const { module } = await loadThumbnailCompletion({
    files: [file({ name: 'clip.mp4', type: 'Video' })],
    entriesByRelativePath: {
      folder: [
        'clip.mp4-v2-scrub-hash-a.jpg',
        'clip.mp4-v2-posterframe-hash-a.jpg',
        'clip.mp4-v1-250j80-hash-a.jpg',
        'clip.mp4-v1-500j80-hash-a.jpg',
      ],
    },
  });

  await expect(
    module.thumbnailCompletionForFolder(folder(), MediaTypeFilter.Video),
  ).resolves.toEqual({
    totalFiles: 1,
    completeFiles: 0,
    incompleteFiles: 1,
    totalArtifacts: 10,
    missingArtifacts: 6,
  });
});

test('thumbnailCompletionForFolder treats missing file hashes as fully incomplete', async () => {
  const { module } = await loadThumbnailCompletion({
    files: [file({ fileHash: null })],
    entriesByRelativePath: {
      folder: thumbnailVariantNames('photo.jpg'),
    },
  });

  await expect(
    module.thumbnailCompletionForFolder(folder(), MediaTypeFilter.Image),
  ).resolves.toMatchObject({
    totalFiles: 1,
    completeFiles: 0,
    incompleteFiles: 1,
    totalArtifacts: 8,
    missingArtifacts: 8,
  });
});

test('thumbnailCompletionForFolder indexes each cache directory once', async () => {
  const { entries, module } = await loadThumbnailCompletion({
    files: [
      file({ id: 1, name: 'a.jpg' }),
      file({ id: 2, name: 'b.jpg' }),
      file({ id: 3, name: 'c.jpg', relativePath: 'other' }),
    ],
    entriesByRelativePath: {},
  });

  await expect(
    module.thumbnailCompletionForFolder(folder(), MediaTypeFilter.Image),
  ).resolves.toMatchObject({
    totalFiles: 3,
    completeFiles: 0,
    incompleteFiles: 3,
    totalArtifacts: 24,
    missingArtifacts: 24,
  });
  expect(entries).toHaveBeenCalledTimes(2);
  expect(entries).toHaveBeenNthCalledWith(1, 'folder');
  expect(entries).toHaveBeenNthCalledWith(2, 'other');
});

const file = (
  overrides: Partial<MockThumbnailFile> = {},
): MockThumbnailFile => ({
  fileHash: 'hash-a',
  id: 7,
  name: 'photo.jpg',
  relativePath: 'folder',
  type: 'Image',
  ...overrides,
});

const folder = () => ({
  id: 1,
  name: 'Folder',
  relativePath: 'folder',
});

const thumbnailVariantNames = (name: string): string[] => [
  `${name}-v1-250j80-hash-a.jpg`,
  `${name}-v1-500j80-hash-a.jpg`,
  `${name}-v1-750j80-hash-a.jpg`,
  `${name}-v1-1000j80-hash-a.jpg`,
  `${name}-v1-1500j80-hash-a.jpg`,
  `${name}-v1-2048j80-hash-a.jpg`,
  `${name}-v1-2560j80-hash-a.jpg`,
  `${name}-v1-4000j80-hash-a.jpg`,
];
