import { useAtom } from 'jotai/index';
import { filterOptions } from '../../../atoms/filterAtom';
import { Box, TextInput } from 'grommet';
import { Search } from 'grommet-icons';

export const SearchBox = () => {
  const [options, setOptions] = useAtom(filterOptions);
  return (
    <Box>
      <TextInput
        icon={<Search />}
        width={'small'}
        // placeholder="Search"
        value={options.searchText}
        onChange={(e) =>
          setOptions((o) => ({ ...o, searchText: e.target.value }))
        }
      />
    </Box>
  );
};
