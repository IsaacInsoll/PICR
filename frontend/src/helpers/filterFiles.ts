import { MinimalFile } from '../../types';
import {
  AspectFilterOptions,
  FilterOptionsInterface,
} from '../atoms/filterAtom';
import { MetadataOptionsForFiltering } from './metadataForFiltering';
import { MetadataSummary } from '../../../backend/types/MetadataSummary';
import { FileSort } from '../atoms/fileSortAtom';

export const sortFiles = (files: MinimalFile[], sort: FileSort) => {
  const { type, direction } = sort;
  const positive = direction == 'Asc' ? 1 : -1;
  if (type == 'Filename') {
    return files.toSorted((a, b) => {
      if (a.name < b.name) return -positive;
      if (a.name > b.name) return positive;
      return 0;
    });
  }
  if (type == 'LastModified') {
    return files.toSorted((a, b) => {
      if (a.fileLastModified < b.fileLastModified) return positive;
      if (a.fileLastModified > b.fileLastModified) return -positive;
      return 0;
    });
  }
  if (type == 'RecentlyCommented') {
    return files.toSorted((a, b) => {
      console.log(a.latestComment, b.latestComment);
      if (!a.latestComment || a.latestComment < b.latestComment)
        return positive;
      if (!b.latestComment || a.latestComment > b.latestComment)
        return -positive;
      return 0;
    });
  }
  if (type == 'Rating') {
    return files.toSorted((a, b) => {
      if (a.rating < b.rating) return positive;
      if (a.rating > b.rating) return -positive;
      return 0;
    });
  }
  return files;
};

export const filterFiles = (
  files: MinimalFile[],
  filters: FilterOptionsInterface,
) => {
  const { ratio, searchText, metadata } = filters;
  return files.filter((file: MinimalFile) => {
    return (
      ratioFilter(file, ratio) &&
      textFilter(file, searchText) &&
      metadataFilter(file, metadata) &&
      commentsFilter(file, filters)
    );
  });
};

const textFilter = (file: MinimalFile, text: string): boolean => {
  return !!file.name && file.name?.toLowerCase().includes(text.toLowerCase());
};

const ratioFilter = (
  file: MinimalFile,
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
  file: MinimalFile,
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
  file: MinimalFile,
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
  if (comments == 'None' && file.totalComments > 0) return false;
  if (comments == 'Some' && file.totalComments == 0) return false;

  return true;
};
