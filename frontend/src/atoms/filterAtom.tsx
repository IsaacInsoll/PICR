import { atom } from 'jotai/index';

export const filterAtom = atom<boolean>(false); // is filtering enabled?

export type AspectFilterOptions =
  | 'Any Ratio'
  | 'Landscape'
  | 'Square'
  | 'Portrait';

export interface FilterOptionsInterface {
  ratio: AspectFilterOptions;
  searchText: string;
}

export const DefaultFilterOptions: FilterOptionsInterface = {
  ratio: 'Any Ratio',
  searchText: '',
};

export const filterOptions = atom<FilterOptionsInterface>(DefaultFilterOptions);
