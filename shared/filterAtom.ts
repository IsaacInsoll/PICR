import { atom } from 'jotai';
import { MetadataOptionsForFiltering } from './files/metadataForFiltering';
import { FileFlag } from '../graphql-types';
import { DefaultFilterOptions } from './files/filterFiles';

export const filterAtom = atom<boolean>(false); // is filtering enabled?

export type AspectFilterOptions =
  | 'Any Ratio'
  | 'Landscape'
  | 'Square'
  | 'Portrait';

export type RatingsComparisonOptions = 'equal' | 'lessThan' | 'greaterThan';
export type CommentsFilterOptions = 'None' | 'Some';

export interface FilterOptionsInterface {
  ratio: AspectFilterOptions;
  searchText: string;
  metadata: MetadataOptionsForFiltering;
  flag: FileFlag | null;
  ratingComparison: RatingsComparisonOptions | null;
  rating: number;
  comments: CommentsFilterOptions | null;
}

export const filterOptions = atom<FilterOptionsInterface>(DefaultFilterOptions);

export const resetFilterOptions = atom(null, (_get, set) => {
  set(filterOptions, DefaultFilterOptions);
});

export const totalFilterOptionsSelected = atom((get) => {
  const { ratio, searchText, ratingComparison, flag, comments } =
    get(filterOptions);
  const totalMeta = get(totalMetadataFilterOptionsSelected);
  let total = totalMeta;
  if (ratio !== 'Any Ratio') total++;
  if (searchText && searchText !== '') total++;
  if (ratingComparison) total++;
  if (flag) total++;
  if (comments) total++;
  return total;
});

export const totalMetadataFilterOptionsSelected = atom((get) => {
  const { metadata } = get(filterOptions);
  let total = 0;
  Object.entries(metadata).forEach(([, options]) => {
    if (options.length) total++;
  });
  return total;
});
