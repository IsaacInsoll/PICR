import { atom } from 'jotai/index';
import { MetadataOptionsForFiltering } from '../helpers/metadataForFiltering';
import { FileFlag } from '../../../graphql-types';

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

export const DefaultFilterOptions: FilterOptionsInterface = {
  ratio: 'Any Ratio',
  searchText: '',
  metadata: {},
  flag: null,
  ratingComparison: null,
  rating: 0,
  comments: null,
};

export const filterOptions = atom<FilterOptionsInterface>(DefaultFilterOptions);

export const resetFilterOptions = atom(null, (get, set, update) => {
  set(filterOptions, DefaultFilterOptions);
});

export const totalFilterOptionsSelected = atom((get) => {
  const { ratio, searchText, metadata, ratingComparison, flag, comments } =
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
