import { MinimalFile } from '../../types';
import {
  AspectFilterOptions,
  FilterOptionsInterface,
} from '../atoms/filterAtom';

export const filterFiles = (
  files: MinimalFile[],
  filters: FilterOptionsInterface,
) => {
  const { ratio, searchText } = filters;
  return files.filter((file: MinimalFile) => {
    return ratioFilter(file, ratio) && textFilter(file, searchText);
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
