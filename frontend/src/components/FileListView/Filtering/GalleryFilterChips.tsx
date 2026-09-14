import { Button, Group } from '@mantine/core';
import {
  localMetadataFilterKeys,
  type GalleryFilterCriteria,
} from '@shared/files/mediaCriteria';
import { useTranslation } from 'react-i18next';
import { useDateFormatters } from '../../../i18n/useDateFormatters';
import { formatMetadataValues } from '../../../metadata/formatMetadataValues';
import { CloseIcon } from '../../../PicrIcons';
import { fileFlagStyles } from '../Review/fileFlagStyles';

interface FilterChip {
  key: string;
  label: string;
  remove: () => void;
}

export const GalleryFilterChips = ({
  filters,
  onChange,
  includeMetadata = true,
}: {
  filters: GalleryFilterCriteria;
  onChange: (filters: GalleryFilterCriteria) => void;
  includeMetadata?: boolean;
}) => {
  const { t } = useTranslation('gallery');
  const { formattingLocale, invalidDateLabel } = useDateFormatters();
  const chips: FilterChip[] = [];

  if (filters.mediaType !== 'All') {
    chips.push({
      key: 'mediaType',
      label: t(
        filters.mediaType === 'Image'
          ? 'filter.mediaTypeImages'
          : 'filter.mediaTypeVideos',
      ),
      remove: () => onChange({ ...filters, mediaType: 'All' }),
    });
  }
  if (filters.aspect !== 'any') {
    chips.push({
      key: 'aspect',
      label: t(`filter.aspect.${filters.aspect}`),
      remove: () => onChange({ ...filters, aspect: 'any' }),
    });
  }
  if (filters.flag) {
    chips.push({
      key: 'flag',
      label: t(fileFlagStyles[filters.flag].labelKey),
      remove: () => onChange({ ...filters, flag: null }),
    });
  }
  if (filters.ratingComparison) {
    chips.push({
      key: 'rating',
      label: t('filter.active.rating', {
        comparison: t(`filter.ratingComparison.${filters.ratingComparison}`),
        value: filters.rating,
      }),
      remove: () => onChange({ ...filters, ratingComparison: null, rating: 0 }),
    });
  }
  if (filters.comments) {
    chips.push({
      key: 'comments',
      label: t(
        filters.comments === 'some'
          ? 'filter.commentsHas'
          : 'filter.commentsNone',
      ),
      remove: () => onChange({ ...filters, comments: null }),
    });
  }
  if (includeMetadata) {
    for (const key of localMetadataFilterKeys) {
      const values = filters.metadata[key] ?? [];
      if (!values.length) continue;
      chips.push({
        key: `metadata-${key}`,
        label: t('filter.active.metadata', {
          name: t(`metadata.${key}`),
          value: formatMetadataValues(
            key,
            values,
            formattingLocale,
            invalidDateLabel,
          )
            .map(({ label }) => label)
            .join(', '),
        }),
        remove: () =>
          onChange({
            ...filters,
            metadata: { ...filters.metadata, [key]: [] },
          }),
      });
    }
  }

  if (!chips.length) return null;

  return (
    <Group gap={6} wrap="wrap">
      {chips.map((chip) => (
        <Button
          key={chip.key}
          variant="default"
          size="compact-sm"
          rightSection={<CloseIcon size={14} />}
          onClick={chip.remove}
          aria-label={t('filter.remove', { filter: chip.label })}
        >
          {chip.label}
        </Button>
      ))}
    </Group>
  );
};
