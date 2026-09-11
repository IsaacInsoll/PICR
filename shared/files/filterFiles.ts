import type { FilterOptionsInterface } from '@shared/filterAtom';
import type { MetadataOptionsForFiltering } from '@shared/files/metadataForFiltering';
import type { FileFlag } from '@shared/gql/graphql';
import type { PicrMetadataMap } from '@shared/types/metadata';
import {
  defaultGalleryFilterCriteria,
  normalizeSearchText,
  type AspectFilter,
  type MediaTypeFilterValue,
} from './mediaCriteria';

export const DefaultFilterOptions = defaultGalleryFilterCriteria;

type FilterableFile = {
  __typename: string;
  type?: string | null;
  name?: string | null;
  imageRatio?: number | null;
  metadata?: PicrMetadataMap | null;
  flag?: FileFlag | null;
  rating?: number | null;
  totalComments?: number | null;
};

export const filterFiles = <T extends FilterableFile>(
  files: T[],
  filters: FilterOptionsInterface,
): T[] => {
  const { mediaType, aspect, searchText, metadata } = filters;
  return files.filter((file: T) => {
    return (
      mediaTypeFilter(file, mediaType) &&
      aspectFilter(file, aspect) &&
      textFilter(file, searchText) &&
      metadataFilter(file, metadata) &&
      commentsFilter(file, filters)
    );
  });
};

const textFilter = (file: FilterableFile, text: string): boolean =>
  !!file.name &&
  normalizeSearchText(file.name).includes(normalizeSearchText(text));

const mediaTypeFilter = (
  file: FilterableFile,
  mediaType: MediaTypeFilterValue,
): boolean =>
  mediaType === 'All' || (file.type ?? file.__typename) === mediaType;

const aspectFilter = (file: FilterableFile, aspect: AspectFilter): boolean => {
  const ar = file.imageRatio ?? null;
  if (typeof ar !== 'number' || !Number.isFinite(ar) || ar <= 0) {
    return aspect === 'any';
  }

  return (
    aspect === 'any' ||
    (aspect === 'square' && ar >= 0.9 && ar <= 1.1) ||
    (aspect === 'landscape' && ar > 1.1) ||
    (aspect === 'portrait' && ar < 0.9)
  );
};

const metadataFilter = (
  file: FilterableFile,
  metadata: MetadataOptionsForFiltering,
): boolean => {
  let allowed = true;
  Object.entries(metadata).forEach(([title, options]) => {
    if (options.length > 0) {
      if (file.__typename === 'File') {
        allowed = false; // basic files don't have metadata
      } else {
        const val = file.metadata?.[title];
        if (!val || !options.includes(val)) allowed = false;
      }
    }
  });
  return allowed;
};

const commentsFilter = (
  file: FilterableFile,
  filters: FilterOptionsInterface,
): boolean => {
  const { flag, rating, ratingComparison, comments } = filters;
  const flagOk =
    flag == null || file.flag === flag || (flag === 'none' && !file.flag);
  if (!flagOk) return false;
  if (ratingComparison) {
    const r = file.rating ?? 0;
    switch (ratingComparison) {
      case 'equal':
        if (r !== rating) return false;
        break;
      case 'atLeast':
        if (!(r >= rating)) return false;
        break;
      case 'atMost':
        if (!(r <= rating)) return false;
        break;
    }
  }
  const tc = file.totalComments ?? 0;
  if (comments === 'none' && tc > 0) return false;
  if (comments === 'some' && tc === 0) return false;

  return true;
};
