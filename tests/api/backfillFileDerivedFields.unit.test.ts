import { afterEach, expect, test, vi } from 'vitest';

interface MockFile {
  capturedAt: Date | null;
  id: number;
  metadata: string | null;
  name: string;
  normalizedName: string | null;
  normalizedNameSource: string | null;
  normalizedRelativePath: string | null;
  normalizedRelativePathSource: string | null;
  relativePath: string;
  updatedAt: Date;
}

const baseFile = (overrides: Partial<MockFile> = {}): MockFile => ({
  capturedAt: null,
  id: 1,
  metadata: '{"DateTimeOriginal":"2025-04-03T12:01:00+10:00"}',
  name: 'Café.JPG',
  normalizedName: null,
  normalizedNameSource: null,
  normalizedRelativePath: null,
  normalizedRelativePathSource: null,
  relativePath: 'Pörsche/Social',
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  ...overrides,
});

const keysetCursor = (node: unknown, idColumn: string): number | undefined => {
  if (typeof node !== 'object' || node === null) return undefined;
  const value = node as {
    and?: unknown[];
    gt?: [string, unknown];
    queryChunks?: unknown[];
  };
  if (value.gt?.[0] === idColumn && typeof value.gt[1] === 'number') {
    return value.gt[1];
  }

  const chunks = value.queryChunks;
  if (Array.isArray(chunks)) {
    const idIndex = chunks.indexOf(idColumn);
    if (idIndex !== -1) {
      const bound = chunks
        .slice(idIndex + 1)
        .find((chunk) => typeof chunk === 'number');
      if (typeof bound === 'number') return bound;
    }
    for (const entry of chunks) {
      const cursor = keysetCursor(entry, idColumn);
      if (cursor !== undefined) return cursor;
    }
  }

  for (const entry of value.and ?? []) {
    const cursor = keysetCursor(entry, idColumn);
    if (cursor !== undefined) return cursor;
  }
  return undefined;
};

const searchFieldsAreStale = (file: MockFile): boolean =>
  file.normalizedName !== 'cafe.jpg' ||
  file.normalizedNameSource !== file.name ||
  file.normalizedRelativePath !== 'porsche/social' ||
  file.normalizedRelativePathSource !== file.relativePath;

const loadBackfill = async (
  files: MockFile[],
  { updatedIds = files.map(({ id }) => id) }: { updatedIds?: number[] } = {},
) => {
  vi.resetModules();
  const columns = {
    dbFile: {
      capturedAt: 'Files.capturedAt',
      exists: 'Files.exists',
      id: 'Files.id',
      metadata: 'Files.metadata',
      name: 'Files.name',
      normalizedName: 'Files.normalizedName',
      normalizedNameSource: 'Files.normalizedNameSource',
      normalizedRelativePath: 'Files.normalizedRelativePath',
      normalizedRelativePathSource: 'Files.normalizedRelativePathSource',
      relativePath: 'Files.relativePath',
    },
  };
  const log = vi.fn();
  const findMany = vi.fn(async ({ where }: { where: unknown }) => {
    const cursor = keysetCursor(where, columns.dbFile.id);
    return files
      .filter((file) => cursor === undefined || file.id > cursor)
      .slice(0, 500);
  });
  const counts = [files.filter(searchFieldsAreStale).length, files.length];
  const selectBuilder = {
    from: vi.fn(() => selectBuilder),
    where: vi.fn(async () => [{ count: counts.shift() ?? 0 }]),
  };
  const execute = vi.fn(async () => ({
    rows: updatedIds.map((id) => ({ id })),
  }));

  const sqlMock = vi.fn(
    (strings: TemplateStringsArray, ...values: unknown[]) => ({
      sql: [strings, values],
    }),
  );
  Object.assign(sqlMock, {
    join: vi.fn((values: unknown[], separator: unknown) => ({
      join: [values, separator],
    })),
  });
  vi.doMock('drizzle-orm', () => ({
    and: vi.fn((...conditions: unknown[]) => ({ and: conditions })),
    asc: vi.fn((column: string) => ({ asc: column })),
    count: vi.fn(() => 'count(*)'),
    eq: vi.fn((column: string, value: unknown) => ({ eq: [column, value] })),
    gt: vi.fn((column: string, value: unknown) => ({ gt: [column, value] })),
    isNotNull: vi.fn((column: string) => ({ isNotNull: column })),
    isNull: vi.fn((column: string) => ({ isNull: column })),
    or: vi.fn((...conditions: unknown[]) => ({ or: conditions })),
    sql: sqlMock,
  }));
  vi.doMock('../../backend/db/models/index.js', () => columns);
  vi.doMock('../../backend/db/picrDb.js', () => ({
    db: {
      query: { dbFile: { findMany } },
      execute,
      select: vi.fn(() => selectBuilder),
    },
  }));
  vi.doMock('../../backend/logger.js', () => ({ log }));

  const module =
    await import('../../backend/boot/backfillFileDerivedFields.js');
  return { ...module, execute, findMany, log };
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

test('backfills normalized search fields and capture dates', async () => {
  const files = [baseFile()];
  const { backfillFileDerivedFields, execute, prepareFileDerivedFieldsUpdate } =
    await loadBackfill(files);

  await expect(backfillFileDerivedFields()).resolves.toEqual({
    capturedAtBackfilled: 1,
    searchFieldsBackfilled: 1,
    malformedCaptureDates: 0,
  });
  expect(prepareFileDerivedFieldsUpdate(files[0])).toMatchObject({
    capturedAt: new Date('2025-04-03T02:01:00.000Z'),
    sourceMetadata: files[0].metadata,
    searchFields: {
      normalizedName: 'cafe.jpg',
      normalizedNameSource: 'Café.JPG',
      normalizedRelativePath: 'porsche/social',
      normalizedRelativePathSource: 'Pörsche/Social',
    },
  });
  expect(execute).toHaveBeenCalledOnce();
});

test('repairs a non-null normalized path made stale by an older rename', async () => {
  const files = [
    baseFile({
      capturedAt: new Date('2025-04-03T02:01:00.000Z'),
      normalizedName: 'cafe.jpg',
      normalizedNameSource: 'Café.JPG',
      normalizedRelativePath: 'porsche/old campaign',
      normalizedRelativePathSource: 'Pörsche/Old Campaign',
      relativePath: 'Pörsche/New Campaign',
    }),
  ];
  const { backfillFileDerivedFields, prepareFileDerivedFieldsUpdate } =
    await loadBackfill(files);

  await expect(backfillFileDerivedFields()).resolves.toEqual({
    capturedAtBackfilled: 0,
    searchFieldsBackfilled: 1,
    malformedCaptureDates: 0,
  });
  expect(prepareFileDerivedFieldsUpdate(files[0])).toMatchObject({
    searchFields: {
      normalizedRelativePath: 'porsche/new campaign',
      normalizedRelativePathSource: 'Pörsche/New Campaign',
    },
    sourceMetadata: null,
  });
});

test('warns without showing search progress when malformed dates are the only work', async () => {
  const files = [
    baseFile({
      metadata: '{"DateTimeOriginal":"not-a-date"}',
      normalizedName: 'cafe.jpg',
      normalizedNameSource: 'Café.JPG',
      normalizedRelativePath: 'porsche/social',
      normalizedRelativePathSource: 'Pörsche/Social',
    }),
  ];
  const { backfillFileDerivedFields, execute, log } = await loadBackfill(files);

  await expect(backfillFileDerivedFields()).resolves.toEqual({
    capturedAtBackfilled: 0,
    searchFieldsBackfilled: 0,
    malformedCaptureDates: 1,
  });
  expect(execute).not.toHaveBeenCalled();
  expect(log).toHaveBeenCalledWith(
    'warn',
    expect.stringContaining('invalid DateTimeOriginal'),
    true,
  );
  expect(log).not.toHaveBeenCalledWith(
    'info',
    expect.any(String),
    expect.anything(),
  );
});

test('is quiet when no rows need work', async () => {
  const { backfillFileDerivedFields, execute, log } = await loadBackfill([]);

  await expect(backfillFileDerivedFields()).resolves.toEqual({
    capturedAtBackfilled: 0,
    searchFieldsBackfilled: 0,
    malformedCaptureDates: 0,
  });
  expect(execute).not.toHaveBeenCalled();
  expect(log).not.toHaveBeenCalled();
});

test('only counts rows accepted by the concurrent-source guards', async () => {
  const { backfillFileDerivedFields, execute } = await loadBackfill(
    [baseFile()],
    { updatedIds: [] },
  );

  await expect(backfillFileDerivedFields()).resolves.toEqual({
    capturedAtBackfilled: 0,
    searchFieldsBackfilled: 0,
    malformedCaptureDates: 0,
  });
  expect(execute).toHaveBeenCalledOnce();
});

test('writes derived values once per batch rather than once per row', async () => {
  const files = Array.from({ length: 501 }, (_, index) =>
    baseFile({ id: index + 1, metadata: null }),
  );
  const { backfillFileDerivedFields, execute } = await loadBackfill(files);

  await expect(backfillFileDerivedFields()).resolves.toEqual({
    capturedAtBackfilled: 0,
    searchFieldsBackfilled: 501,
    malformedCaptureDates: 0,
  });
  expect(execute).toHaveBeenCalledTimes(2);
});
