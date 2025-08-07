import { useAtom } from 'jotai/index';
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
        setOptions((o) => ({ ...o, searchText: e.target.value }))
      }
    />
  );
};
