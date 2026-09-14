import { Button, Group, Paper, Text, Tooltip } from '@mantine/core';
import {
  countGalleryFilterCriteria,
  localMetadataFilterKeys,
  type GalleryFilterCriteria,
} from '@shared/files/mediaCriteria';
import type { ViewFolder } from '@shared/files/sortFiles';
import { useTranslation } from 'react-i18next';
import { useGalleryMatchSummary } from '../../../hooks/useGalleryMatchSummary';
import { useDateFormatters } from '../../../i18n/useDateFormatters';
import { formatMetadataValues } from '../../../metadata/formatMetadataValues';
import { CloseIcon } from '../../../PicrIcons';
import { Page } from '../../Page';
import { fileFlagStyles } from '../Review/fileFlagStyles';

interface FilterChip {
  key: string;
  label: string;
  remove: () => void;
}

export const GalleryFilterSummary = ({
  folder,
  filters,
  totalFiltered,
  onChange,
  onReset,
  onShowAll,
}: {
  folder: ViewFolder;
  filters: GalleryFilterCriteria;
  totalFiltered: number;
  onChange: (filters: GalleryFilterCriteria) => void;
  onReset: () => void;
  onShowAll: () => void;
}) => {
  const { t } = useTranslation('gallery');
  const { formattingLocale, invalidDateLabel } = useDateFormatters();
  const totalFilters = countGalleryFilterCriteria(filters);
  const { summary, fetching, hasLocalOnlyFilters } = useGalleryMatchSummary({
    folderId: folder.id,
    hasSubfolders: folder.subFolders.length > 0,
    filters,
  });

  if (!totalFilters) return null;

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

  const recursiveCount = summary?.treeCount ?? 0;
  const directCount = summary?.directCount ?? 0;
  const moreCount = Math.max(0, recursiveCount - directCount);

  return (
    <Page>
      <Paper
        radius="md"
        px="sm"
        py="xs"
        mb="md"
        bg="var(--mantine-color-default-hover)"
      >
        <Group justify="space-between" gap="xs" align="center">
          <Group gap={6} flex={1}>
            {chips.map((chip) => (
              <Button
                key={chip.key}
                variant="default"
                size="compact-sm"
                rightSection={<CloseIcon size={14} />}
                onClick={chip.remove}
                aria-label={t('filter.remove', {
                  filter: chip.label,
                })}
              >
                {chip.label}
              </Button>
            ))}
          </Group>
          <Group gap="xs" wrap="wrap" justify="flex-end">
            <Text size="sm" c="dimmed" aria-live="polite">
              {t('filter.summary.shownHere', {
                visible: totalFiltered,
                total: folder.files.length,
              })}
            </Text>
            {hasLocalOnlyFilters && folder.subFolders.length > 0 ? (
              <Tooltip label={t('filter.summary.localOnlyHelp')} withArrow>
                <Text size="xs" c="dimmed">
                  {t('filter.summary.localOnly')}
                </Text>
              </Tooltip>
            ) : null}
            {!fetching && moreCount > 0 ? (
              <Button variant="subtle" size="compact-sm" onClick={onShowAll}>
                {t('filter.summary.showAll', {
                  more: moreCount,
                  total: recursiveCount,
                })}
              </Button>
            ) : null}
            <Button variant="subtle" size="compact-sm" onClick={onReset}>
              {t('filter.clearNone')}
            </Button>
          </Group>
        </Group>
      </Paper>
    </Page>
  );
};
