import { describe, expect, test } from 'vitest';
import {
  directoriesForEvent,
  mediaPathFor,
  normaliseWirePath,
} from '../src/pathMapping.js';

describe('media path mapping', () => {
  test('maps WATCH_ROOT paths into the configured media prefix', () => {
    expect(
      mediaPathFor(
        '/media/Weddings/Smith/IMG_001.CR3',
        '/media',
        'Archive/Studio',
      ),
    ).toBe('Archive/Studio/Weddings/Smith/IMG_001.CR3');
  });

  test('rejects paths outside WATCH_ROOT', () => {
    expect(() => mediaPathFor('/other/photo.jpg', '/media', '')).toThrow(
      'escaped WATCH_ROOT',
    );
  });

  test('validates wire prefixes', () => {
    expect(normaliseWirePath('Archive/Studio')).toBe('Archive/Studio');
    expect(() => normaliseWirePath('../Studio')).toThrow('safe relative path');
    expect(() => normaliseWirePath('Archive//Studio')).toThrow(
      'normalised relative path',
    );
  });
});

describe('event mapping', () => {
  const mapped = (
    event: Parameters<typeof directoriesForEvent>[0],
    path: string,
  ) => directoriesForEvent(event, path, '/media', 'Archive/Studio');

  test('maps file events to their containing directory', () => {
    expect(mapped('add', '/media/Weddings/Smith/photo.jpg')).toEqual({
      directories: ['Archive/Studio/Weddings/Smith'],
      unlinkDerived: false,
    });
    expect(mapped('unlink', '/media/Weddings/Smith/photo.jpg')).toEqual({
      directories: ['Archive/Studio/Weddings/Smith'],
      unlinkDerived: true,
    });
  });

  test('allows a full file path to exceed the directory-column limit', () => {
    const directory = 'd'.repeat(240);
    const filename = 'f'.repeat(255);

    expect(mapped('add', `/media/${directory}/${filename}`)).toEqual({
      directories: [`Archive/Studio/${directory}`],
      unlinkDerived: false,
    });
  });

  test('maps directory additions to parent and child', () => {
    expect(mapped('addDir', '/media/Weddings/Smith')).toEqual({
      directories: ['Archive/Studio/Weddings', 'Archive/Studio/Weddings/Smith'],
      unlinkDerived: false,
    });
  });

  test('maps directory deletion to its live parent', () => {
    expect(mapped('unlinkDir', '/media/Weddings/Smith')).toEqual({
      directories: ['Archive/Studio/Weddings'],
      unlinkDerived: true,
    });
  });
});
