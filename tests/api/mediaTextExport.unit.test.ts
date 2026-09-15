import { expect, test } from 'vitest';
import { formatMediaTextExport } from '../../backend/mediaResults/mediaTextExport.js';

const files = [
  {
    name: 'hero,final.jpg',
    relativePath: 'Campaign/Social',
    rating: 5,
    flag: 'approved',
  },
  {
    name: 'hero.jpg',
    relativePath: 'Campaign/Web',
    rating: 3,
    flag: null,
  },
];

test('formats PICR CSV with relative paths and escaped filenames', () => {
  expect(formatMediaTextExport(files, 'picr', false)).toBe(
    [
      '"Campaign/Social/hero,final.jpg",5,approved',
      'Campaign/Web/hero.jpg,3,',
    ].join('\n'),
  );
});

test('preserves comma and space filename formats with optional extensions', () => {
  expect(formatMediaTextExport(files, 'comma', false)).toBe(
    'Campaign/Social/hero,final.jpg,Campaign/Web/hero.jpg',
  );
  expect(formatMediaTextExport(files, 'space', true)).toBe(
    'Campaign/Social/hero,final Campaign/Web/hero',
  );
});
