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

describe('filterFiles structured criteria', () => {
  const structuredFiles = [
    {
      __typename: 'Image',
      type: 'Image',
      name: 'portrait.jpg',
      imageRatio: 0.8,
      rating: 3,
    },
    {
      __typename: 'Image',
      type: 'Image',
      name: 'square.jpg',
      imageRatio: 0.9,
      rating: 4,
    },
    {
      __typename: 'Video',
      type: 'Video',
      name: 'landscape.mp4',
      imageRatio: 1.1,
      rating: 5,
    },
    {
      __typename: 'Video',
      type: 'Video',
      name: 'wide.mp4',
      imageRatio: 1.2,
      rating: null,
    },
    {
      __typename: 'Image',
      type: 'Image',
      name: 'unknown.jpg',
      imageRatio: null,
      rating: null,
    },
  ];

  it('filters using the existing GraphQL media type values', () => {
    expect(
      filterFiles(structuredFiles, {
        ...DefaultFilterOptions,
        mediaType: 'Video',
      }).map(({ name }) => name),
    ).toEqual(['landscape.mp4', 'wide.mp4']);
  });

  it('keeps aspect categories mutually exclusive at square boundaries', () => {
    const namesFor = (aspect: 'portrait' | 'square' | 'landscape') =>
      filterFiles(structuredFiles, {
        ...DefaultFilterOptions,
        aspect,
      }).map(({ name }) => name);

    expect(namesFor('portrait')).toEqual(['portrait.jpg']);
    expect(namesFor('square')).toEqual(['square.jpg', 'landscape.mp4']);
    expect(namesFor('landscape')).toEqual(['wide.mp4']);
  });

  it('uses inclusive at-least and at-most rating comparisons', () => {
    expect(
      filterFiles(structuredFiles, {
        ...DefaultFilterOptions,
        ratingComparison: 'atLeast',
        rating: 4,
      }).map(({ name }) => name),
    ).toEqual(['square.jpg', 'landscape.mp4']);
    expect(
      filterFiles(structuredFiles, {
        ...DefaultFilterOptions,
        ratingComparison: 'atMost',
        rating: 3,
      }).map(({ name }) => name),
    ).toEqual(['portrait.jpg', 'wide.mp4', 'unknown.jpg']);
  });
});
