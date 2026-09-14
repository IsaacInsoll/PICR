import { SegmentedControl } from '@mantine/core';
import {
  mediaTypeFilterValues,
  type GalleryFilterCriteria,
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

export const MediaTypeSelector = ({
  filters,
  onChange,
}: {
  filters: GalleryFilterCriteria;
  onChange: (filters: GalleryFilterCriteria) => void;
}) => {
  const { t } = useTranslation('gallery');

  return (
    <SegmentedControl
      value={filters.mediaType}
      onChange={(mediaType) => {
        const nextMediaType = mediaTypeFilterValues.find(
          (value) => value === mediaType,
        );
        if (!nextMediaType) return;
        onChange({
          ...filters,
          mediaType: nextMediaType,
        });
      }}
      data={mediaTypeFilterValues.map((value) => ({
        value,
        label: t(labelKeys[value]),
      }))}
      fullWidth
    />
  );
};
