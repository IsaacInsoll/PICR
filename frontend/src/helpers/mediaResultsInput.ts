import {
  countMediaFilterCriteria,
  type AspectFilter,
  type GalleryFilterCriteria,
  type RatingComparison as CriteriaRatingComparison,
} from '@shared/files/mediaCriteria';
import {
  FileFlag,
  MediaAspectFilter,
  MediaCommentsFilter,
  MediaResultSortDirection,
  MediaResultSortType,
  MediaTypeFilter,
  RatingComparison,
  type MediaResultsFilterInput,
  type MediaResultsSortInput,
} from '@shared/gql/graphql';
import type { FileSort } from '@shared/files/sortFiles';

const flagValues = {
  approved: FileFlag.Approved,
  rejected: FileFlag.Rejected,
  none: FileFlag.None,
} as const;

const aspectValues: Record<AspectFilter, MediaAspectFilter | undefined> = {
  any: undefined,
  landscape: MediaAspectFilter.Landscape,
  square: MediaAspectFilter.Square,
  portrait: MediaAspectFilter.Portrait,
};

const ratingValues: Record<CriteriaRatingComparison, RatingComparison> = {
  equal: RatingComparison.Equal,
  atLeast: RatingComparison.AtLeast,
  atMost: RatingComparison.AtMost,
};

export const hasLocalOnlyGalleryFilters = (
  filters: GalleryFilterCriteria,
): boolean =>
  !!filters.searchText.trim() ||
  Object.values(filters.metadata).some((values) => values.length > 0);

export const countRecursiveGalleryFilters = (
  filters: GalleryFilterCriteria,
): number => countMediaFilterCriteria({ ...filters, metadata: {} });

export const mediaResultsFilterInput = (
  filters: GalleryFilterCriteria,
): MediaResultsFilterInput => ({
  mediaType:
    filters.mediaType === 'All'
      ? undefined
      : filters.mediaType === 'Image'
        ? MediaTypeFilter.Image
        : MediaTypeFilter.Video,
  aspect: aspectValues[filters.aspect],
  flag: filters.flag ? flagValues[filters.flag] : undefined,
  rating: filters.ratingComparison
    ? {
        comparison: ratingValues[filters.ratingComparison],
        value: filters.rating,
      }
    : undefined,
  comments:
    filters.comments === 'some'
      ? MediaCommentsFilter.Some
      : filters.comments === 'none'
        ? MediaCommentsFilter.None
        : undefined,
});

const sortTypes: Record<FileSort['type'], MediaResultSortType> = {
  Filename: MediaResultSortType.Filename,
  LastModified: MediaResultSortType.LastModified,
  DateTaken: MediaResultSortType.DateTaken,
  RecentlyCommented: MediaResultSortType.RecentlyCommented,
  Rating: MediaResultSortType.Rating,
};

export const mediaResultsSortInput = (
  sort: FileSort,
): MediaResultsSortInput => ({
  type: sortTypes[sort.type],
  direction:
    sort.direction === 'Asc'
      ? MediaResultSortDirection.Asc
      : MediaResultSortDirection.Desc,
});
