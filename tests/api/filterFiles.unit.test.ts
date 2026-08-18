import { describe, expect, it } from 'vitest';
import {
  DefaultFilterOptions,
  filterFiles,
} from '../../shared/files/filterFiles';

const files = [
  { __typename: 'Image', name: 'Café portrait.jpg' },
  { __typename: 'Image', name: 'ÉTÉ 2024.jpg' },
  { __typename: 'Image', name: 'cafe\u0301 details.jpg' },
  { __typename: 'Image', name: 'Winter.jpg' },
];

const search = (searchText: string) =>
  filterFiles(files, { ...DefaultFilterOptions, searchText }).map(
    ({ name }) => name,
  );

describe('filterFiles text search', () => {
  it('matches precomposed accented characters without accents', () => {
    expect(search('cafe')).toEqual([
      'Café portrait.jpg',
      'cafe\u0301 details.jpg',
    ]);
  });

  it('matches case-insensitively across accented text', () => {
    expect(search('ete')).toEqual(['ÉTÉ 2024.jpg']);
  });

  it('normalizes decomposed characters in the search term', () => {
    expect(search('cafe\u0301')).toEqual([
      'Café portrait.jpg',
      'cafe\u0301 details.jpg',
    ]);
  });

  it('does not match unrelated names', () => {
    expect(search('summer')).toEqual([]);
  });
});
