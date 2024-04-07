import { useAtom } from 'jotai/index';
import { filterOptions } from '../../../atoms/filterAtom';
import { Box, ResponsiveContext, TextInput } from 'grommet';
import { Search } from 'grommet-icons';
import { useContext } from 'react';

export const SearchBox = () => {
  const [options, setOptions] = useAtom(filterOptions);
  const size = useContext(ResponsiveContext);
  return (
    <Box>
      <TextInput
        icon={<Search />}
        width={size === 'small' ? 'xsmall' : 'small'}
        // placeholder="Search"
        value={options.searchText}
        onChange={(e) =>
          setOptions((o) => ({ ...o, searchText: e.target.value }))
        }
      />
    </Box>
  );
};
