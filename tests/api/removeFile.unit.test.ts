import { afterEach, expect, test, vi } from 'vitest';

interface MockFileRow {
  exists: boolean;
  name: string;
  relativePath: string;
}

const loadRemoveFile = async (files: MockFileRow[]) => {
  vi.resetModules();

  const columns = {
    dbFile: {
      exists: 'Files.exists',
      name: 'Files.name',
      relativePath: 'Files.relativePath',
    },
  };

  vi.doMock('drizzle-orm', () => ({
    and: vi.fn((...conditions: unknown[]) => ({ conditions })),
    eq: vi.fn((column: string, value: unknown) => ({ column, value })),
  }));
  vi.doMock('../../backend/db/models/index.js', () => columns);
  vi.doMock('../../backend/db/picrDb.js', () => ({
    db: {
      update: vi.fn(() => ({
        set: vi.fn((values: Partial<MockFileRow>) => ({
          where: vi.fn(async () => {
            files.forEach((file) => {
              if (
                file.exists &&
                file.name === 'image.jpg' &&
                file.relativePath === 'gallery'
              ) {
                Object.assign(file, values);
              }
            });
          }),
        })),
      })),
    },
  }));

  const { removeFile } =
    await import('../../backend/filesystem/events/removeFile.js');
  return { removeFile };
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

test('archives every live row matching the file path', async () => {
  const files: MockFileRow[] = [
    { exists: true, name: 'image.jpg', relativePath: 'gallery' },
    { exists: true, name: 'image.jpg', relativePath: 'gallery' },
    { exists: false, name: 'image.jpg', relativePath: 'gallery' },
    { exists: true, name: 'other.jpg', relativePath: 'gallery' },
    { exists: true, name: 'image.jpg', relativePath: '' },
  ];
  const { removeFile } = await loadRemoveFile(files);

  await removeFile('/media/gallery/image.jpg');

  expect(files).toMatchObject([
    { exists: false, name: 'image.jpg', relativePath: 'gallery' },
    { exists: false, name: 'image.jpg', relativePath: 'gallery' },
    { exists: false, name: 'image.jpg', relativePath: 'gallery' },
    { exists: true, name: 'other.jpg', relativePath: 'gallery' },
    { exists: true, name: 'image.jpg', relativePath: '' },
  ]);
});
