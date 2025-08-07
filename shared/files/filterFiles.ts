import {AspectFilterOptions, FilterOptionsInterface,} from '@/filterAtom';
import {MetadataOptionsForFiltering} from '@/files/metadataForFiltering';
import {MetadataSummary} from '../../backend/types/MetadataSummary';
import {File, Image, Video} from '@/gql/graphql'

export const DefaultFilterOptions: FilterOptionsInterface = {
  ratio: 'Any Ratio',
  searchText: '',
  metadata: {},
  flag: null,
  ratingComparison: null,
  rating: 0,
  comments: null,
};

export const filterFiles = (
  files: File[],
  filters: FilterOptionsInterface,
) => {
  const { ratio, searchText, metadata } = filters;
  return files.filter((file: File) => {
    return (
      ratioFilter(file, ratio) &&
      textFilter(file, searchText) &&
      metadataFilter(file, metadata) &&
      commentsFilter(file, filters)
    );
  });
};

const textFilter = (file: File, text: string): boolean => {
  return !!file.name && file.name?.toLowerCase().includes(text.toLowerCase());
};

const ratioFilter = (
  file: File|Image,
  ratio: AspectFilterOptions,
): boolean => {
  const ar = file.imageRatio;
  if (!ar) return ratio === 'Any Ratio';

  return (
    ratio === 'Any Ratio' ||
    (ratio === 'Square' && ar > 0.9 && ar < 1.1) ||
    (ratio === 'Landscape' && ar > 0.9) ||
    (ratio === 'Portrait' && ar < 1.1)
  );
};

const metadataFilter = (
  file: File|Image|Video,
  metadata: MetadataOptionsForFiltering,
): boolean => {
  let allowed = true;
  Object.entries(metadata).forEach(([title, options]) => {
    if (options.length > 0) {
      const val = file.metadata?.[title as keyof MetadataSummary];
      if (!val || !options.includes(val)) allowed = false;
    }
  });
  return allowed;
};

const commentsFilter = (
  file: File,
  filters: FilterOptionsInterface,
): boolean => {
  const { flag, rating, ratingComparison, comments } = filters;
  const flagOk =
    flag == null || file.flag == flag || (flag == 'none' && !file.flag);
  if (!flagOk) return false;
  if (ratingComparison) {
    const r = file.rating ?? 0;
    console.log([ratingComparison, file.rating, rating]);
    switch (ratingComparison) {
      case 'equal':
        if (r != rating) return false;
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
  if (comments == 'None' && tc > 0) return false;
  if (comments == 'Some' && tc == 0) return false;

  return true;
};
