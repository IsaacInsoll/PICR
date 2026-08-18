import { useAtom } from 'jotai';
import type {
  AspectFilterOptions,
  FilterOptionsInterface,
} from '@shared/filterAtom';
import { filterOptions } from '@shared/filterAtom';
import {
  AspectAnyIcon,
  AspectLandscapeIcon,
  AspectPortraitIcon,
  AspectSquareIcon,
} from '../../../PicrIcons';
import type { SelectProps } from '@mantine/core';
import { Group, Select } from '@mantine/core';
import type { ReactNode } from 'react';

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
      data={aspectRatioOptions}
      renderOption={renderOption}
    />
  );
};

const renderOption: SelectProps['renderOption'] = ({ option }) => {
  const value = option.value as AspectFilterOptions;
  return (
    <Group flex={1} gap="sm">
      <div>{aspectRatioIcon[value]}</div>
      <div>{option.label}</div>
    </Group>
  );
};

const aspectRatioOptions: Array<{
  value: AspectFilterOptions;
  label: string;
}> = [
  { value: 'any', label: 'Any Ratio' },
  { value: 'landscape', label: 'Landscape' },
  { value: 'square', label: 'Square' },
  { value: 'portrait', label: 'Portrait' },
];

const aspectRatioIcon: Record<AspectFilterOptions, ReactNode> = {
  any: <AspectAnyIcon />,
  square: <AspectSquareIcon />,
  landscape: <AspectLandscapeIcon />,
  portrait: <AspectPortraitIcon />,
} as const;
