import { useAtom } from 'jotai/index';
import { filterOptions } from '../../../atoms/filterAtom';
import { TextInput } from '@mantine/core';
import { TbSearch } from 'react-icons/tb';

export const SearchBox = () => {
  const [options, setOptions] = useAtom(filterOptions);
  return (
    <TextInput
      leftSection={<TbSearch />}
      placeholder="Search"
      value={options.searchText}
      onChange={(e) =>
        setOptions((o) => ({ ...o, searchText: e.target.value }))
      }
    />
  );
};
