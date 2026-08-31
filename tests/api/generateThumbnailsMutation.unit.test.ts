import { expect, test } from 'vitest';
import { MediaTypeFilter } from '../../shared/gql/graphql';
import { mediaTypesForGenerateThumbnails } from '../../backend/graphql/mutations/generateThumbnails';

test('mediaTypesForGenerateThumbnails defaults to image and video media', () => {
  expect(mediaTypesForGenerateThumbnails(undefined)).toEqual([
    'Image',
    'Video',
  ]);
  expect(mediaTypesForGenerateThumbnails(null)).toEqual(['Image', 'Video']);
  expect(mediaTypesForGenerateThumbnails(MediaTypeFilter.All)).toEqual([
    'Image',
    'Video',
  ]);
});

test('mediaTypesForGenerateThumbnails can target one thumbnail media type', () => {
  expect(mediaTypesForGenerateThumbnails(MediaTypeFilter.Image)).toEqual([
    'Image',
  ]);
  expect(mediaTypesForGenerateThumbnails(MediaTypeFilter.Video)).toEqual([
    'Video',
  ]);
});
