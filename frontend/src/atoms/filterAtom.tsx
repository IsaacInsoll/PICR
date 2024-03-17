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
