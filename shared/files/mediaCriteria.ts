import type { MetadataOptionsForFiltering } from './metadataForFiltering.js';
import type { MediaTypeFilter } from '../gql/graphql.js';

export const aspectFilterValues = [
  'any',
  'landscape',
  'square',
  'portrait',
] as const;
export type AspectFilter = (typeof aspectFilterValues)[number];

export const ratingComparisonValues = ['equal', 'atMost', 'atLeast'] as const;
export type RatingComparison = (typeof ratingComparisonValues)[number];

export const commentPresenceValues = ['none', 'some'] as const;
export type CommentPresence = (typeof commentPresenceValues)[number];

export const fileFlagFilterValues = ['approved', 'rejected', 'none'] as const;
export type FileFlagFilter = (typeof fileFlagFilterValues)[number];

// Keep these values aligned with the existing GraphQL MediaTypeFilter enum
// without importing that generated runtime. This module is consumed by both
// Metro and, later, the Node backend, whose runtime import conventions differ.
export const mediaTypeFilterValues = [
  'All',
  'Image',
  'Video',
] as const satisfies readonly `${MediaTypeFilter}`[];
export type MediaTypeFilterValue = (typeof mediaTypeFilterValues)[number];

export const localMetadataFilterKeys = [
  'Camera',
  'Lens',
  'Aperture',
  'ExposureTime',
  'ISO',
] as const;
export type LocalMetadataFilterKey = (typeof localMetadataFilterKeys)[number];

export interface MediaFilterCriteria {
  mediaType: MediaTypeFilterValue;
  aspect: AspectFilter;
  metadata: MetadataOptionsForFiltering;
  flag: FileFlagFilter | null;
  ratingComparison: RatingComparison | null;
  rating: number;
  comments: CommentPresence | null;
}

// Filename search remains here temporarily so the current Filter drawer keeps
// working until the visible Find replacement lands. It is deliberately not a
// member of MediaFilterCriteria and will not enter recursive filter requests.
export interface GalleryFilterCriteria extends MediaFilterCriteria {
  searchText: string;
}

export interface MediaCriteriaCapabilities {
  canViewReview: boolean;
}

export const defaultMediaFilterCriteria: MediaFilterCriteria = {
  mediaType: 'All',
  aspect: 'any',
  metadata: {},
  flag: null,
  ratingComparison: null,
  rating: 0,
  comments: null,
};

export const defaultGalleryFilterCriteria: GalleryFilterCriteria = {
  ...defaultMediaFilterCriteria,
  searchText: '',
};

const isIncluded = <T extends string>(
  values: readonly T[],
  value: unknown,
): value is T => typeof value === 'string' && values.includes(value as T);

const normalizeMetadata = (
  metadata: MetadataOptionsForFiltering | null | undefined,
): MetadataOptionsForFiltering => {
  const normalized: MetadataOptionsForFiltering = {};

  for (const key of localMetadataFilterKeys) {
    const values = metadata?.[key];
    if (!values?.length) continue;

    const unique = new Map<string, string | number>();
    for (const value of values) {
      if (
        (typeof value !== 'string' && typeof value !== 'number') ||
        (typeof value === 'number' && !Number.isFinite(value)) ||
        value === ''
      ) {
        continue;
      }
      unique.set(`${typeof value}:${String(value)}`, value);
    }

    const ordered = [...unique.values()].sort((a, b) =>
      `${typeof a}:${String(a)}`.localeCompare(`${typeof b}:${String(b)}`),
    );
    if (ordered.length) normalized[key] = ordered;
  }

  return normalized;
};

export const normalizeMediaFilterCriteria = (
  criteria: Partial<MediaFilterCriteria> | null | undefined,
  capabilities: MediaCriteriaCapabilities = { canViewReview: true },
): MediaFilterCriteria => {
  const mediaType = isIncluded(mediaTypeFilterValues, criteria?.mediaType)
    ? criteria.mediaType
    : defaultMediaFilterCriteria.mediaType;
  const aspect = isIncluded(aspectFilterValues, criteria?.aspect)
    ? criteria.aspect
    : defaultMediaFilterCriteria.aspect;
  const ratingComparison = isIncluded(
    ratingComparisonValues,
    criteria?.ratingComparison,
  )
    ? criteria.ratingComparison
    : null;
  const requestedRating = Number(criteria?.rating);
  const rating = ratingComparison
    ? Math.min(5, Math.max(0, Math.round(requestedRating || 0)))
    : 0;

  return {
    mediaType,
    aspect,
    metadata: normalizeMetadata(criteria?.metadata),
    flag:
      capabilities.canViewReview &&
      isIncluded(fileFlagFilterValues, criteria?.flag)
        ? criteria.flag
        : null,
    ratingComparison: capabilities.canViewReview ? ratingComparison : null,
    rating: capabilities.canViewReview ? rating : 0,
    comments:
      capabilities.canViewReview &&
      isIncluded(commentPresenceValues, criteria?.comments)
        ? criteria.comments
        : null,
  };
};

export const normalizeGalleryFilterCriteria = (
  criteria: Partial<GalleryFilterCriteria> | null | undefined,
  capabilities?: MediaCriteriaCapabilities,
): GalleryFilterCriteria => ({
  ...normalizeMediaFilterCriteria(criteria, capabilities),
  searchText:
    typeof criteria?.searchText === 'string' ? criteria.searchText : '',
});

export const normalizeSearchText = (value: string): string =>
  value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

// PostgreSQL's C collation compares valid UTF-8 strings by Unicode code point.
// JavaScript's relational operators compare UTF-16 code units instead, which
// differs for characters outside the BMP. Keep filename ordering deterministic
// across the local gallery and server-side Results by comparing code points.
export const compareTextCodePoints = (left: string, right: string): number => {
  const leftPoints = Array.from(left, (character) => character.codePointAt(0));
  const rightPoints = Array.from(right, (character) =>
    character.codePointAt(0),
  );
  const sharedLength = Math.min(leftPoints.length, rightPoints.length);
  for (let index = 0; index < sharedLength; index++) {
    const difference = (leftPoints[index] ?? -1) - (rightPoints[index] ?? -1);
    if (difference !== 0) return difference;
  }
  return leftPoints.length - rightPoints.length;
};

export const compareNormalizedSearchText = (
  left: string,
  right: string,
): number =>
  compareTextCodePoints(normalizeSearchText(left), normalizeSearchText(right));

export const countMediaFilterCriteria = (
  criteria: MediaFilterCriteria,
): number => {
  const normalized = normalizeMediaFilterCriteria(criteria);
  let total = Object.values(normalized.metadata).filter(
    (values) => values.length,
  ).length;
  if (normalized.mediaType !== 'All') total++;
  if (normalized.aspect !== 'any') total++;
  if (normalized.ratingComparison) total++;
  if (normalized.flag) total++;
  if (normalized.comments) total++;
  return total;
};

export const countGalleryFilterCriteria = (
  criteria: GalleryFilterCriteria,
): number => countMediaFilterCriteria(criteria) + (criteria.searchText ? 1 : 0);

export const mediaCriteriaFingerprint = (
  criteria: MediaFilterCriteria,
): string => JSON.stringify(normalizeMediaFilterCriteria(criteria));

export const mediaCriteriaEqual = (
  left: MediaFilterCriteria,
  right: MediaFilterCriteria,
): boolean =>
  mediaCriteriaFingerprint(left) === mediaCriteriaFingerprint(right);
