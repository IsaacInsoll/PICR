import { atom } from 'jotai/index';
import { MetadataOptionsForFiltering } from '../helpers/metadataForFiltering';

export const filterAtom = atom<boolean>(false); // is filtering enabled?

export type AspectFilterOptions =
  | 'Any Ratio'
  | 'Landscape'
  | 'Square'
  | 'Portrait';

export interface FilterOptionsInterface {
  ratio: AspectFilterOptions;
  searchText: string;
  metadata: MetadataOptionsForFiltering;
}

export const DefaultFilterOptions: FilterOptionsInterface = {
  ratio: 'Any Ratio',
  searchText: '',
  metadata: {},
};

export const filterOptions = atom<FilterOptionsInterface>(DefaultFilterOptions);

export const resetFilterOptions = atom(null, (get, set, update) => {
  set(filterOptions, DefaultFilterOptions);
});

export const totalFilterOptionsSelected = atom((get) => {
  const { ratio, searchText, metadata } = get(filterOptions);
  const totalMeta = get(totalMetadataFilterOptionsSelected);
  let total = totalMeta;
  if (ratio !== 'Any Ratio') total++;
  if (searchText && searchText !== '') total++;
  return total;
});

export const totalMetadataFilterOptionsSelected = atom((get) => {
  const { metadata } = get(filterOptions);
  let total = 0;
  Object.entries(metadata).forEach(([options]) => {
    if (options.length) total++;
  });
  return total;
});
