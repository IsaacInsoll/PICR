import { describe, expect, test } from 'vitest';
import { sortFiles } from '../../shared/files/sortFiles.js';

describe('Date Taken sorting', () => {
  test('prefers capturedAt and preserves the existing fallback chain', () => {
    const files = [
      {
        name: 'derived.jpg',
        capturedAt: '2024-01-01T00:00:00.000Z',
        metadata: { DateTimeOriginal: '2030-01-01T00:00:00.000Z' },
        fileLastModified: '2031-01-01T00:00:00.000Z',
      },
      {
        name: 'legacy.jpg',
        metadata: { DateTimeOriginal: '2025-01-01T00:00:00.000Z' },
        fileLastModified: '2032-01-01T00:00:00.000Z',
      },
      {
        name: 'video.mp4',
        fileLastModified: '2026-01-01T00:00:00.000Z',
      },
    ];

    expect(
      sortFiles(files, { type: 'DateTaken', direction: 'Asc' }).map(
        ({ name }) => name,
      ),
    ).toEqual(['derived.jpg', 'legacy.jpg', 'video.mp4']);
  });
});
