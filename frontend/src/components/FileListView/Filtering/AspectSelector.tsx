import { useAtom } from 'jotai/index';
import {
  AspectFilterOptions,
  FilterOptionsInterface,
  filterOptions,
} from '@shared/filterAtom';
import {
  AspectAnyIcon,
  AspectLandscapeIcon,
  AspectPortraitIcon,
  AspectSquareIcon,
} from '../../../PicrIcons';
import { Group, Select, SelectProps } from '@mantine/core';

export const AspectSelector = () => {
  const [options, setOptions] = useAtom(filterOptions);
  const onChange = (a: AspectFilterOptions) =>
    setOptions((o: FilterOptionsInterface) => ({ ...o, ratio: a }));
  return (
    <Select
      style={{ width: '150px' }}
      // label={options.ratio}
      value={options.ratio}
      onChange={(v) => v && onChange(v as AspectFilterOptions)}
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

const renderOption: SelectProps['renderOption'] = ({ option }) => {
  const label = option.label as AspectFilterOptions;
  return (
    <Group flex={1} gap="sm">
      <div>{aspectRatioIcon[label]}</div>
      <div>{label}</div>
    </Group>
  );
};

const aspectRatioIcon = {
  'Any Ratio': <AspectAnyIcon />,
  Square: <AspectSquareIcon />,
  Landscape: <AspectLandscapeIcon />,
  Portrait: <AspectPortraitIcon />,
} as const;
