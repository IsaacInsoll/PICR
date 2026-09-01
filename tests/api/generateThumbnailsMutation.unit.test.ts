import { expect, test } from 'vitest';
import { MediaTypeFilter } from '../../shared/gql/graphql';
import { mediaTypesForThumbnailWork } from '../../backend/media/mediaTypeFilter';

test('mediaTypesForThumbnailWork defaults to image and video media', () => {
  expect(mediaTypesForThumbnailWork(undefined)).toEqual(['Image', 'Video']);
  expect(mediaTypesForThumbnailWork(null)).toEqual(['Image', 'Video']);
  expect(mediaTypesForThumbnailWork(MediaTypeFilter.All)).toEqual([
    'Image',
    'Video',
  ]);
});

test('mediaTypesForThumbnailWork can target one thumbnail media type', () => {
  expect(mediaTypesForThumbnailWork(MediaTypeFilter.Image)).toEqual(['Image']);
  expect(mediaTypesForThumbnailWork(MediaTypeFilter.Video)).toEqual(['Video']);
});
