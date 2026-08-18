import type {
  AspectFilterOptions,
  FilterOptionsInterface,
} from '@shared/filterAtom';
import type { MetadataOptionsForFiltering } from '@shared/files/metadataForFiltering';
import type { FileFlag } from '@shared/gql/graphql';
import type { PicrMetadataMap } from '@shared/types/metadata';

export const DefaultFilterOptions: FilterOptionsInterface = {
  ratio: 'any',
  searchText: '',
  metadata: {},
  flag: null,
  ratingComparison: null,
  rating: 0,
  comments: null,
};

type FilterableFile = {
  __typename: string;
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
  const { ratio, searchText, metadata } = filters;
  return files.filter((file: T) => {
    return (
      ratioFilter(file, ratio) &&
      textFilter(file, searchText) &&
      metadataFilter(file, metadata) &&
      commentsFilter(file, filters)
    );
  });
};

const normalizeSearchText = (value: string): string =>
  value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

const textFilter = (file: FilterableFile, text: string): boolean =>
  !!file.name &&
  normalizeSearchText(file.name).includes(normalizeSearchText(text));

const ratioFilter = (
  file: FilterableFile,
  ratio: AspectFilterOptions,
): boolean => {
  const ar = file.imageRatio ?? null;
  if (!ar) return ratio === 'any';

  return (
    ratio === 'any' ||
    (ratio === 'square' && ar > 0.9 && ar < 1.1) ||
    (ratio === 'landscape' && ar > 0.9) ||
    (ratio === 'portrait' && ar < 1.1)
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
      case 'greaterThan':
        if (!(r >= rating)) return false;
        break;
      case 'lessThan':
        if (!(r <= rating)) return false;
        break;
    }
  }
  const tc = file.totalComments ?? 0;
  if (comments === 'none' && tc > 0) return false;
  if (comments === 'some' && tc === 0) return false;

  return true;
};
