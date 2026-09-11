import { useAtom } from 'jotai';
import type { FilterOptionsInterface } from '@shared/filterAtom';
import type { AspectFilter } from '@shared/files/mediaCriteria';
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
  const onChange = (aspect: AspectFilter) =>
    setOptions((o: FilterOptionsInterface) => ({ ...o, aspect }));
  return (
    <Select
      style={{ width: '150px' }}
      value={options.aspect}
      onChange={(v) => v && onChange(v as AspectFilter)}
      leftSection={aspectRatioIcon[options.aspect]}
      data={aspectRatioOptions.map(({ value, labelKey }) => ({
        value,
        label: t(labelKey),
      }))}
      renderOption={renderOption}
    />
  );
};

const renderOption: SelectProps['renderOption'] = ({ option }) => {
  const value = option.value as AspectFilter;
  return (
    <Group flex={1} gap="sm">
      <div>{aspectRatioIcon[value]}</div>
      <div>{option.label}</div>
    </Group>
  );
};

const aspectRatioOptions: Array<{
  value: AspectFilter;
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

const aspectRatioIcon: Record<AspectFilter, ReactNode> = {
  any: <AspectAnyIcon />,
  square: <AspectSquareIcon />,
  landscape: <AspectLandscapeIcon />,
  portrait: <AspectPortraitIcon />,
} as const;
