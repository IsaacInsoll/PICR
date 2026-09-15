import { describe, expect, it } from 'vitest';
import {
  DefaultFilterOptions,
  filterFiles,
} from '../../shared/files/filterFiles';

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
