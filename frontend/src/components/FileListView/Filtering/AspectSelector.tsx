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
import { useTranslation } from 'react-i18next';

export const AspectSelector = () => {
  const { t } = useTranslation('gallery');
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
      data={aspectRatioOptions.map(({ value, labelKey }) => ({
        value,
        label: t(labelKey),
      }))}
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
  labelKey:
    | 'filter.aspect.any'
    | 'filter.aspect.landscape'
    | 'filter.aspect.square'
    | 'filter.aspect.portrait';
}> = [
  { value: 'any', labelKey: 'filter.aspect.any' },
  { value: 'landscape', labelKey: 'filter.aspect.landscape' },
  { value: 'square', labelKey: 'filter.aspect.square' },
  { value: 'portrait', labelKey: 'filter.aspect.portrait' },
];

const aspectRatioIcon: Record<AspectFilterOptions, ReactNode> = {
  any: <AspectAnyIcon />,
  square: <AspectSquareIcon />,
  landscape: <AspectLandscapeIcon />,
  portrait: <AspectPortraitIcon />,
} as const;
