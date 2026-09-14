import { Button, Group, Paper, Text, Tooltip } from '@mantine/core';
import {
  countGalleryFilterCriteria,
  type GalleryFilterCriteria,
} from '@shared/files/mediaCriteria';
import type { ViewFolder } from '@shared/files/sortFiles';
import { useTranslation } from 'react-i18next';
import { useGalleryMatchSummary } from '../../../hooks/useGalleryMatchSummary';
import { Page } from '../../Page';
import { GalleryFilterChips } from './GalleryFilterChips';

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
  const totalFilters = countGalleryFilterCriteria(filters);
  const { summary, fetching, hasLocalOnlyFilters } = useGalleryMatchSummary({
    folderId: folder.id,
    hasSubfolders: folder.subFolders.length > 0,
    filters,
  });

  if (!totalFilters) return null;

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
            <GalleryFilterChips filters={filters} onChange={onChange} />
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
