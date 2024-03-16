import { MinimalFile } from '../../../types';
import { Box, Menu, Page, PageContent, TextInput, Toolbar } from 'grommet';
import {
  MdOutlineCropFree,
  MdOutlineCropLandscape,
  MdOutlineCropPortrait,
  MdOutlineCropSquare,
} from 'react-icons/md';
import { useAtom } from 'jotai';
import { AspectFilterOptions, filterOptions } from '../../atoms/filterAtom';
import { Search } from 'grommet-icons';
import { ReactNode } from 'react';

export const FilteringOptions = ({ files }: { files: MinimalFile[] }) => {
  console.log(files);
  //filename (textfield)
  //aperture
  //camera
  //lens
  //shutter
  //iso
  return (
    <Page>
      <PageContent>
        <Toolbar
          // background="placeholder"
          border={{ side: 'top', color: 'brand' }}
          // margin={{ top: 'small' }}
          pad="small"
        >
          <SearchBox />
          <AspectSelector />
        </Toolbar>
      </PageContent>
    </Page>
  );
};

const SearchBox = () => {
  const [options, setOptions] = useAtom(filterOptions);
  return (
    <Box>
      <TextInput
        icon={<Search />}
        width={'small'}
        value={options.searchText}
        onChange={(e) =>
          setOptions((o) => ({ ...o, searchText: e.target.value }))
        }
      />
    </Box>
  );
};

const AspectSelector = () => {
  const [options, setOptions] = useAtom(filterOptions);
  const onChange = (a: AspectFilterOptions) =>
    setOptions((o) => ({ ...o, ratio: a }));
  return (
    <Menu
      label={options.ratio}
      icon={aspectRatioIcon[options.ratio]}
      items={[
        {
          label: 'Any Ratio',
          icon: <MdOutlineCropFree />,
          onClick: () => onChange('Any Ratio'),
        },
        {
          label: 'Landscape',
          icon: <MdOutlineCropLandscape />,
          onClick: () => onChange('Landscape'),
        },
        {
          label: 'Square',
          icon: <MdOutlineCropSquare />,
          onClick: () => onChange('Square'),
        },
        {
          label: 'Portrait',
          icon: <MdOutlineCropPortrait />,
          onClick: () => onChange('Portrait'),
        },
      ]}
    />
  );
};

const aspectRatioIcon = {
  'Any Ratio': <MdOutlineCropFree />,
  Square: <MdOutlineCropSquare />,
  Landscape: <MdOutlineCropLandscape />,
  Portrait: <MdOutlineCropPortrait />,
} as const;
