import { MinimalFile } from '../../types';
import {
  AspectFilterOptions,
  FilterOptionsInterface,
} from '../atoms/filterAtom';
import { MetadataOptionsForFiltering } from './metadataForFiltering';
import { metadata } from 'reflect-metadata/no-conflict';
import { Metadata } from 'sharp';
import { MetadataSummary } from '../../../src/types/MetadataSummary';
import { entries } from 'lodash';

export const filterFiles = (
  files: MinimalFile[],
  filters: FilterOptionsInterface,
) => {
  const { ratio, searchText, metadata } = filters;
  return files.filter((file: MinimalFile) => {
    return (
      ratioFilter(file, ratio) &&
      textFilter(file, searchText) &&
      metadataFilter(file, metadata)
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
