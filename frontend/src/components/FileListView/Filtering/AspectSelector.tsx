import type {
  AspectFilter,
  GalleryFilterCriteria,
} from '@shared/files/mediaCriteria';
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

export const AspectSelector = ({
  filters,
  onChange,
}: {
  filters: GalleryFilterCriteria;
  onChange: (filters: GalleryFilterCriteria) => void;
}) => {
  const { t } = useTranslation('gallery');
  return (
    <Select
      style={{ width: '150px' }}
      value={filters.aspect}
      onChange={(value) =>
        value && onChange({ ...filters, aspect: value as AspectFilter })
      }
      leftSection={aspectRatioIcon[filters.aspect]}
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
