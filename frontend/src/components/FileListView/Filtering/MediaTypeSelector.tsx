import { SegmentedControl } from '@mantine/core';
import { useAtom } from 'jotai';
import { filterOptions, type FilterOptionsInterface } from '@shared/filterAtom';
import {
  mediaTypeFilterValues,
  type MediaTypeFilterValue,
} from '@shared/files/mediaCriteria';
import { useTranslation } from 'react-i18next';

const labelKeys: Record<
  MediaTypeFilterValue,
  'filter.mediaTypeAll' | 'filter.mediaTypeImages' | 'filter.mediaTypeVideos'
> = {
  All: 'filter.mediaTypeAll',
  Image: 'filter.mediaTypeImages',
  Video: 'filter.mediaTypeVideos',
};

export const MediaTypeSelector = () => {
  const { t } = useTranslation('gallery');
  const [options, setOptions] = useAtom(filterOptions);

  return (
    <SegmentedControl
      value={options.mediaType}
      onChange={(mediaType) => {
        const nextMediaType = mediaTypeFilterValues.find(
          (value) => value === mediaType,
        );
        if (!nextMediaType) return;
        setOptions((current: FilterOptionsInterface) => ({
          ...current,
          mediaType: nextMediaType,
        }));
      }}
      data={mediaTypeFilterValues.map((value) => ({
        value,
        label: t(labelKeys[value]),
      }))}
      fullWidth
    />
  );
};
