import { useAtom } from 'jotai';
import type { FilterOptionsInterface } from '@shared/filterAtom';
import { filterOptions } from '@shared/filterAtom';
import { TextInput } from '@mantine/core';
import { SearchIcon } from '../../../PicrIcons';

export const SearchBox = () => {
  const [options, setOptions] = useAtom(filterOptions);
  return (
    <TextInput
      leftSection={<SearchIcon />}
      placeholder="Search"
      value={options.searchText}
      onChange={(e) =>
        setOptions((o: FilterOptionsInterface) => ({
          ...o,
          searchText: e.target.value,
        }))
      }
    />
  );
};
