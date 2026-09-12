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

describe('deterministic filename ordering', () => {
  test('uses normalized Unicode code-point order', () => {
    const files = [
      { id: '6', name: '😀.jpg' },
      { id: '5', name: '𐐀.jpg' },
      { id: '4', name: 'Éclair.jpg' },
      { id: '3', name: 'eclair.jpg' },
      { id: '2', name: 'apple.jpg' },
      { id: '1', name: 'Zebra.jpg' },
    ];

    expect(
      sortFiles(files, { type: 'Filename', direction: 'Asc' }).map(
        ({ name }) => name,
      ),
    ).toEqual([
      'apple.jpg',
      'eclair.jpg',
      'Éclair.jpg',
      'Zebra.jpg',
      '𐐀.jpg',
      '😀.jpg',
    ]);
  });

  test('uses the canonical filename order to break equal primary values', () => {
    const files = [
      { id: '2', name: 'Zulu.jpg', rating: 5 },
      { id: '1', name: 'alpha.jpg', rating: 5 },
    ];

    expect(
      sortFiles(files, { type: 'Rating', direction: 'Desc' }).map(
        ({ name }) => name,
      ),
    ).toEqual(['alpha.jpg', 'Zulu.jpg']);
  });
});
