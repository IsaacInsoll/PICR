import { describe, expect, test } from 'vitest';
import { defaultGalleryFilterCriteria } from '@shared/files/mediaCriteria';
import {
  MediaAspectFilter,
  MediaCommentsFilter,
  MediaResultSortDirection,
  MediaResultSortType,
  MediaTypeFilter,
  RatingComparison,
} from '@shared/gql/graphql';
import {
  countRecursiveGalleryFilters,
  hasLocalOnlyGalleryFilters,
  mediaResultsFilterInput,
  mediaResultsSelectionInput,
  mediaResultsSortInput,
} from './mediaResultsInput';

describe('media Results input', () => {
  test('maps supported criteria to the GraphQL contract', () => {
    const filters = {
      ...defaultGalleryFilterCriteria,
      mediaType: 'Video' as const,
      aspect: 'portrait' as const,
      ratingComparison: 'atLeast' as const,
      rating: 5,
      comments: 'some' as const,
      flag: 'approved' as const,
    };

    expect(mediaResultsFilterInput(filters)).toEqual({
      mediaType: MediaTypeFilter.Video,
      aspect: MediaAspectFilter.Portrait,
      flag: 'approved',
      rating: { comparison: RatingComparison.AtLeast, value: 5 },
      comments: MediaCommentsFilter.Some,
    });
    expect(countRecursiveGalleryFilters(filters)).toBe(5);
  });

  test('maps the configured gallery sort without its folder-only option', () => {
    expect(
      mediaResultsSortInput({
        type: 'DateTaken',
        direction: 'Desc',
        foldersFirst: true,
      }),
    ).toEqual({
      type: MediaResultSortType.DateTaken,
      direction: MediaResultSortDirection.Desc,
    });
  });

  test('builds server-owned direct and recursive export selections', () => {
    expect(
      mediaResultsSelectionInput({
        folderId: '7',
        query: 'social',
        filters: {
          ...defaultGalleryFilterCriteria,
          mediaType: 'Video',
        },
        folderIds: ['8'],
        directOnly: true,
      }),
    ).toEqual({
      folderId: '7',
      query: 'social',
      filters: {
        mediaType: MediaTypeFilter.Video,
        aspect: undefined,
        flag: undefined,
        rating: undefined,
        comments: undefined,
        folderIds: ['8'],
      },
      directOnly: true,
    });
  });

  test('identifies metadata criteria as local-only', () => {
    expect(hasLocalOnlyGalleryFilters(defaultGalleryFilterCriteria)).toBe(
      false,
    );
    expect(
      hasLocalOnlyGalleryFilters({
        ...defaultGalleryFilterCriteria,
        metadata: { Camera: ['Canon EOS R5'] },
      }),
    ).toBe(true);
  });
});
