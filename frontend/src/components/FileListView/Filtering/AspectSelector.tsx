import { useAtom } from 'jotai/index';
import { AspectFilterOptions, filterOptions } from '../../../atoms/filterAtom';
import {
  MdOutlineCropFree,
  MdOutlineCropLandscape,
  MdOutlineCropPortrait,
  MdOutlineCropSquare,
} from 'react-icons/md';
import { Group, Select } from '@mantine/core';

export const AspectSelector = () => {
  const [options, setOptions] = useAtom(filterOptions);
  const onChange = (a: AspectFilterOptions) =>
    setOptions((o) => ({ ...o, ratio: a }));
  return (
    <Select
      // label={options.ratio}
      value={options.ratio}
      onChange={(v) => v && onChange(v)}
      leftSection={aspectRatioIcon[options.ratio]}
      data={[
        {
          label: 'Any Ratio',
          value: 'Any Ratio',
        },
        {
          label: 'Landscape',
          value: 'Landscape',
        },
        {
          label: 'Square',
          value: 'Square',
        },
        {
          label: 'Portrait',
          value: 'Portrait',
        },
      ]}
      renderOption={renderOption}
    />
  );
};

const renderOption = ({ option, checked }) => {
  return (
    <Group flex={1} gap="sm">
      <div>{aspectRatioIcon[option.label]}</div>
      <div>{option.label}</div>
    </Group>
  );
};

const aspectRatioIcon = {
  'Any Ratio': <MdOutlineCropFree />,
  Square: <MdOutlineCropSquare />,
  Landscape: <MdOutlineCropLandscape />,
  Portrait: <MdOutlineCropPortrait />,
} as const;
